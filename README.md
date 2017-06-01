# Feedr
A personalized feed reader

### Overview

This feed reader is a single page application (SPA) and will pull feeds from blogs or news sources. The main or home page will display the combined feed from all the sources sorted chronologically. The user will be able to filter between publications through the dropdown on the header menu. Clicking the Feedr logo will display the main page. Clicking on one of the articles will load a popup overlay with more information. The user from that point will be able to either dismiss the additional information with the close button or navigate to the chosen article. The search feature will filter the feed by title according to the user's input in the search input box using [`fuzzysearch`](https://github.com/bevacqua/fuzzysearch). When the input box is cleared, all articles should display in the respective feed.

---

#### Dependencies

- jQuery
- Underscore.js
- Moment.js
- Feed sources
    - Mashable: [`http://mashable.com/stories.json`](http://mashable.com/stories.json)
    - Reddit News: [`https://www.reddit.com/r/worldnews/top/.json`](https://www.reddit.com/r/worldnews/top/.json)
    - Digg: [`http://digg.com/api/news/popular.json`](http://digg.com/api/news/popular.json)
- Heroku proxy server (for APIs that do not support CORS or JSONP)
- fuzzysearch (https://github.com/bevacqua/fuzzysearch)
