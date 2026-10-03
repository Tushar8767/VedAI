const { getCuratedResources, searchYouTubeResources } = require('../services/resourceService');

// GET /api/resources?category=Breathing
const listResources = (req, res) => {
  const { category } = req.query;
  const resources = getCuratedResources(category);
  res.json({
    success: true,
    count: resources.length,
    resources,
    notice: 'All external videos are curated educational/meditative resources hosted on YouTube.'
  });
};

// GET /api/resources/search?q=gita
const searchResources = async (req, res, next) => {
  try {
    const { q } = req.query;
    const resources = await searchYouTubeResources(q);
    res.json({
      success: true,
      query: q || '',
      count: resources.length,
      resources
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listResources,
  searchResources
};
