const axios = require("axios");
const bcryptjs = require("bcryptjs");
const User = require("../models/userModel");
const Job = require("../models/jobModel");

const extractEmail = (text) => {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const matches = text?.match(emailRegex);
  return matches ? matches[0] : null;
};

// Infer job mode from title/description/location
const inferJobMode = (job) => {
  const text = `${job.title} ${job?.description} ${
    job.location?.display_name || job.location || job_location
  }`.toLowerCase();

  if (text.includes("remote")) return "Remote";
  if (text.includes("hybrid")) return "Hybrid";
  if (text.includes("intern")) return "Internship";
  if (text.includes("on-site") || text.includes("onsite")) return "Onsite";

  return "Unspecified";
};

// Normalize jobs from Adzuna or other sources
const normalizeJobs = (jobs, source) => {
  return jobs.map((job) => {
    const description = job.description || job.snippet || "";
    return {
      title: job.title || job.position || "Untitled",
      company: job.company?.display_name || job.company || "Unknown",
      location: job.location?.display_name || job.location || "Remote",
      description,
      url: job.redirect_url || job.url,
      source,
      salary: job.salary_min || null,
      postedAt: job.created || job.date || null,
      skills: job.skills || [],
      mode: inferJobMode(job), // keep this if you're inferring from description or title
      contactEmail: extractEmail(job.description || job.snippet), // <- New helper
    };
  });
};

const fetchAdzunaJobs = async ({ title, location }) => {
  const url = `https://api.adzuna.com/v1/api/jobs/us/search/1`;

  try {
    const res = await axios.get(url, {
      params: {
        app_id: process.env.ADZUNA_APP_ID,
        app_key: process.env.ADZUNA_APP_KEY,
        what: title,
        where: location,
        max_days_old: 30, // Show recent postings
        results_per_page: 30, // Get more results
        sort_by: "date", // Get newest first
      },
    });

    // console.log("Adzuna API response:", res.data); // Log full response

    return res.data.results || [];
  } catch (err) {
    console.error("Adzuna API Error:", err.message);
    if (err.response) {
      console.error("Response data:", err.response.data);
      console.error("Status code:", err.response.status);
    }
    return [];
  }
};

async function jsearchJobs({ title, location }) {
  const options = {
    method: "GET",
    url: "https://jsearch.p.rapidapi.com/search",
    params: {
      query: title,
      location: location,
      page: 2,
      num_pages: 2,
    },
    headers: {
      // "x-rapidapi-key": "e165ae06cemsh8e3b947d3fca54ep19c212jsn459cd70262b4",
      "x-rapidapi-key": "e900ae06cemsh8e3b947d3fca54ep19c212jsn459cd70262b4",
      "x-rapidapi-host": "jsearch.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    console.log("jsearch", response.data);
    return response.data.data;
    // return jsearchJobsData;
  } catch (error) {
    console.error("Error fetching jobs:", error.message);
    return [];
  }
}

exports.getAllJobs = async (req, res) => {
  const user = await User.findById(req.user.id);
  // console.log(user);
  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "User not found",
    });
  }
  try {
    const title = user.jobTitle || req.query.title;
    const location = user.location || req.query.location || "";

    const adzunaJobs = await fetchAdzunaJobs({ title, location });
    const jsearchJobsData = await jsearchJobs({ title, location });

    // const allJobs = [...adzunaJobs, ...jsearchJobsData];
    const allJob = [...adzunaJobs];

    const userPrefs = user;
    // const matchedJobs = allJob.map((job) => {
    //   const score = getJobMatchScore(job, userPrefs);
    //   return { ...job, score };
    // });

    // const adzJob = adzunaJobs.forEach((job) => {
    //   const match = scoreMatch(job, user);
    //   console.log(match);
    // });

    const matchedJobs = allJob.map((job) => {
      const score = getJobMatchScore(userPrefs, job);
      return { ...job, score };
    });

    matchedJobs.sort((a, b) => b.score - a.score);
    const totalScore = matchedJobs.reduce((acc, job) => acc + job.score, 0);
    const averageScore =
      matchedJobs.length > 0 ? Math.round(totalScore / matchedJobs.length) : 0;

    res.status(200).json({
      status: "success",
      results: allJob.length,
      data: {
        // jobs: allJobs,
        totalScore: averageScore,
        matchedJobs: matchedJobs,
      },
    });
  } catch (error) {
    console.log(error.message);
  }
};

exports.saveJob = async (req, res) => {
  if (!req.body) {
    return res
      .status(404)
      .json({ status: "Fail", message: "Job Fields are required" });
  }
  try {
    const jobData = {
      ...req.body,
      userId: req.user.id,
    };
    await Job.create(jobData);
    return res.status(201).json({
      statusCode: "007",
      status: "Success",
      message: "Job Saved Successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: "007",
      status: "Failed",
      message: error.message,
    });
  }
};

exports.getSavedJobs = async (req, res) => {
  const userId = req.user.id; // this is the user ID from the token
  console.log(userId);
  try {
    const savedJobs = await Job.find({ userId }); // find all jobs saved by the user
    if (!savedJobs.length) {
      return res.status(404).json({
        status: "Fail",
        message: "No saved jobs found for this user",
      });
    }

    res.status(200).json({
      statusCode: "007",
      message: "Job Found successfully",
      lenght: savedJobs.length,
      data: savedJobs,
    });
  } catch (error) {
    res.status(500).json({
      status: "Failed",
      message: error.message,
    });
  }
};

function scoreMatch(job, prefs) {
  let score = 0;
  if (job.title.toLowerCase().includes(prefs.jobTitle.toLowerCase()))
    score += 40;
  if (
    // job.location.toLowerCase().includes(prefs.preferredLocation.toLowerCase())
    job.description.toLowerCase().includes(prefs.summary.toLowerCase())
  )
    score += 30;
  const matchedSkills = prefs.skills.filter((skill) =>
    job.description.toLowerCase().includes(skill.toLowerCase())
  );
  score += matchedSkills.length * 10;
  if (
    job.description
      .toLowerCase()
      .includes(prefs.industry.toLowerCase().includes)
  )
    score += 10;
  console.log(score);
  return score;
}

function getJobMatchScore(userPref, job) {
  const userSkills = userPref?.skills
    .join(",")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim());
  const jobDescription = job.description.toLowerCase();
  const jobTitle = job.title.toLowerCase();

  // 1. Job title match (e.g., "software engineer" in "Senior Software Engineer")
  const titleMatch = jobTitle.includes(userPref.jobTitle.toLowerCase());
  const titleScore = titleMatch ? 30 : 0;

  // 2. Skills match (50%)
  const matchedSkills = userSkills.filter(
    (skill) => jobDescription.includes(skill) || jobTitle.includes(skill)
  );
  const skillMatchScore = (matchedSkills.length / userSkills.length) * 50;

  // 3. Seniority vs experience (10%)
  const isSeniorJob = jobTitle.includes("senior");
  const years = parseInt(userPref.yearsOfExperience);
  const seniorityMatch =
    (isSeniorJob && years >= 4) || (!isSeniorJob && years < 4);
  const seniorityScore = seniorityMatch ? 10 : 0;

  // 4. Industry match (10%) — if job mentions user's industry
  const industryScore = jobDescription.includes(userPref.industry.toLowerCase())
    ? 10
    : 0;

  // Total score out of 100
  const totalScore = Math.round(
    titleScore + skillMatchScore + seniorityScore + industryScore
  );

  return totalScore; // return percentage match
}
