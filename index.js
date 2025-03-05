/****************************************************
 * index.js
 * Run:  node index.js
 ****************************************************/

const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
// If you have static files (images, CSS, etc.), place them in "public" folder:
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Route: GET /
 * Renders the sleek "index.ejs" search page.
 * If user typed ?handle=..., redirect to "/:handle".
 */
app.get('/', (req, res) => {
  if (req.query.handle) {
    // e.g. /?handle=tourist => redirect to /tourist
    return res.redirect(`/${req.query.handle}`);
  }
  // Otherwise, just render the search page
  res.render('index');
});

/**
 * Route: GET /:handle
 * Example:  /tourist
 * Fetches user info & submissions from Codeforces, then renders "profile.ejs".
 */
app.get('/:handle', async (req, res) => {
  const { handle } = req.params;

  try {
    // 1) Fetch user info
    const userInfoRes = await axios.get(
      `https://codeforces.com/api/user.info?handles=${handle}`
    );
    const userInfo = userInfoRes.data.result[0];

    // 2) Fetch user submissions
    const submissionsRes = await axios.get(
      `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`
    );
    const submissions = submissionsRes.data.result || [];

    // Filter accepted submissions
    const acceptedSubmissions = submissions.filter(
      (sub) => sub.verdict === 'OK'
    );

    // 3) Build acceptedGrouped & problemStats
    let acceptedGrouped = {};
    let problemStats = {};

    // (a) Group accepted by rating & track solvedCount
    acceptedSubmissions.forEach((sub) => {
      const rating = sub.problem.rating || 'Unrated';
      if (!acceptedGrouped[rating]) {
        acceptedGrouped[rating] = [];
      }
      acceptedGrouped[rating].push(sub);

      const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
      if (!problemStats[problemKey]) {
        problemStats[problemKey] = {
          name: sub.problem.name,
          solvedCount: 0,
          totalAttempts: 0,
          userAcceptanceRate: '0.00',
          overallAcceptanceRate: '0.00',
        };
      }
      problemStats[problemKey].solvedCount++;
    });

    // (b) Count total attempts for each problem
    submissions.forEach((sub) => {
      const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
      if (!problemStats[problemKey]) {
        problemStats[problemKey] = {
          name: sub.problem.name,
          solvedCount: 0,
          totalAttempts: 0,
          userAcceptanceRate: '0.00',
          overallAcceptanceRate: '0.00',
        };
      }
      problemStats[problemKey].totalAttempts++;
    });

    // (c) Calculate acceptance rates
    Object.keys(problemStats).forEach((key) => {
      let p = problemStats[key];
      if (p.totalAttempts > 0) {
        p.userAcceptanceRate = ((p.solvedCount / p.totalAttempts) * 100).toFixed(2);
      }
      // Mock overall acceptance: random 10-90
      p.overallAcceptanceRate = (Math.random() * 80 + 10).toFixed(2);
    });

    // 4) Render "profile.ejs" with all data
    res.render('profile', {
      userInfo,
      acceptedGrouped,
      problemStats
    });
  } catch (error) {
    console.error(error);
    return res.status(404).send('User Not Found! Please check the handle and try again.');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
