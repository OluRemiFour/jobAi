const axios = require("axios");
const bcryptjs = require("bcryptjs");
const User = require("../models/userModel");

const extractEmail = (text) => {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const matches = text?.match(emailRegex);
  return matches ? matches[0] : null;
};

// Infer job mode from title/description/location
const inferJobMode = (job) => {
  const text = `${job.title} ${job?.description} ${
    job.location?.display_name || job.location
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

    console.log("Adzuna API response:", res.data); // Log full response

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
      "x-rapidapi-key": "88ed7dc1d9msh1c25b91d1f551f8p1a1d44jsn4c41c989f3d5",
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
  const user = await User.findById(req.user._id);
  const title = user.jobTitle || req.query.title;
  const location = user.location || req.query.location || "";

  const adzunaJobs = await fetchAdzunaJobs({ title, location });
  const jsearchJobsData = await jsearchJobs({ title, location });

  const allJobs = [...adzunaJobs, ...jsearchJobsData];

  // const userPrefs = req.user; // Assuming req.user contains the user's preferences
  // const matchedJobs = normalizedJobs.map((job) => {
  //   const score = scoreMatch(job, userPrefs);
  //   return { ...job, score };
  // });

  res.status(200).json({
    status: "success",
    results: allJobs.length,
    data: {
      jobs: allJobs,
    },
  });
};

exports.getRecommendedJobs = async (req, res) => {};

function scoreMatch(job, prefs) {
  let score = 0;
  if (job.title.toLowerCase().includes(prefs.jobTitle.toLowerCase()))
    score += 40;
  if (
    job.location.toLowerCase().includes(prefs.preferredLocation.toLowerCase())
  )
    score += 30;
  const matchedSkills = prefs.skills.filter((skill) =>
    job.description.toLowerCase().includes(skill.toLowerCase())
  );
  score += matchedSkills.length * 10;
  return score;
}
