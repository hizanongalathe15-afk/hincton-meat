"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Public search routes
router.post('/products', middleware_1.apiRateLimiter, controllers_1.SearchController.searchProducts);
router.get('/products', middleware_1.apiRateLimiter, controllers_1.SearchController.getFilteredProducts);
router.get('/suggestions', middleware_1.apiRateLimiter, controllers_1.SearchController.getSearchSuggestions);
router.get('/popular', middleware_1.apiRateLimiter, controllers_1.SearchController.getPopularSearches);
router.get('/autocomplete', middleware_1.apiRateLimiter, controllers_1.SearchController.getAutocompleteSuggestions);
router.post('/advanced', middleware_1.apiRateLimiter, controllers_1.SearchController.advancedSearch);
// Category search
router.get('/categories', middleware_1.apiRateLimiter, controllers_1.SearchController.searchCategories);
exports.default = router;
//# sourceMappingURL=search.js.map