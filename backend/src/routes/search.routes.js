const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// MODULE G1 - Global Search
router.get('/global', searchController.globalSearch);
router.get('/clients', searchController.searchClients);
router.get('/reports', searchController.searchReports);
router.get('/sections', searchController.searchSections);
router.get('/evidence', searchController.searchEvidence);

// MODULE G2 - Filter by
router.get('/filter/year', searchController.filterByYear);
router.get('/filter/status', searchController.filterByStatus);
router.get('/filter/user', searchController.filterByUser);
router.get('/filter/type', searchController.filterByType);
router.get('/filter/client', searchController.filterByClient);

// Advanced Search
router.post('/advanced', searchController.advancedSearch);

// Search Suggestions
router.get('/suggestions', searchController.getSearchSuggestions);

// Recent Searches
router.get('/recent', searchController.getRecentSearches);
router.post('/recent', searchController.saveRecentSearch);

module.exports = router;
