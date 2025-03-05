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
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  if (req.query.handle) {
    return res.redirect(`/${req.query.handle}`);
  }
  res.render('index');
});

app.get('/:handle', async (req, res) => {
  const { handle } = req.params;

  try {
    const userInfoRes = await axios.get(
      `https://codeforces.com/api/user.info?handles=${handle}`
    );
    const userInfo = userInfoRes.data.result[0];
    const submissionsRes = await axios.get(
      `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`
    );
    const submissions = submissionsRes.data.result || [];
    const acceptedSubmissions = submissions.filter(
      (sub) => sub.verdict === 'OK'
    );
    let acceptedGrouped = {},problemStats = {};
    acceptedSubmissions.forEach((sub) =>{
      const rating =sub.problem.rating ||'Unrated' ;
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
