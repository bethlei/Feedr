// News Feeder
// Build a news feeder from three different sources (Reddit, Mashable, and Diggs) using jQuery, Underscore.js, Moment.js
// Author: Elizabeth Lei
// Date: April 28, 2017

$(document).ready(function(){

  // Array to store all feed sources
  var SOURCES = [
    {
      displayName: "Reddit",
      url: "https://www.reddit.com/r/worldnews/top/.json",
      proxyRequired: false,
      defaultSource: true, // You can have only one default source
      formatResponse: function(response) {
        var articles = response.data.children;
        return _.map(articles, function(article) {
          return {
            thumbnail: null,
            title: article.data.title,
            score: article.data.score,
            tag: article.data.subreddit,
            description: article.data.domain,
            link: article.data.url,
            author: article.data.author,
            date: article.data.created
          };
        });
      }
    },
    {
      displayName: "Mashable",
      url: "http://mashable.com/stories.json",
      proxyRequired: true,
      defaultSource: false,
      formatResponse: function(response) {
        var articles = response.new;
        return _.map(articles, function(article) {
          return {
            thumbnail: article.responsive_images[2].image,
            title: article.title,
            score: article.formatted_shares,
            tag: article.channel,
            description: article.content.plain,
            link: article.link,
            author: article.author,
            date: article.post_date
          };
        });
      }
    },
    {
      displayName: "Digg",
      url: "http://digg.com/api/news/popular.json",
      proxyRequired: true,
      defaultSource: false,
      formatResponse: function(response) {
        var articles = response.data.feed;
        return _.map(articles, function(article) {
          return {
            thumbnail: article.content.media.images[3].url,
            title: article.content.title,
            score: article.digg_score,
            tag: article.content.kicker,
            description: article.content.description,
            link: article.content.url,
            author: article.content.author,
            date: article.date
          };
        });
      }
    }
  ];

  // Prefix url for proxy
  var PROXY_URL = "https://accesscontrolalloworiginall.herokuapp.com/";

  // Utils object to store any misc. methods
  var Utils = {
    markupFromArticles: function(articles) {
      return _.map(articles, function(article) {
        return Utils.markupFromSingleArticle(article);
      }).join('');
    },
    markupFromSingleArticle: function(article) {
      return Utils.articleTemplate(article);
    },
    articleTemplate: _.template('<article class="article clearfix" data-date="<%= date %>"><section class="featuredImage"><img src="<%= thumbnail %>" alt=""></section><section class="articleContent"><a href="<%= link %>" data-description="<%= description %>"><h3><%= title %></h3></a><h6><%= tag %></h6></section><section class="impressions"><%= score %></section></article>'),
    // fuzzySearch from https://github.com/bevacqua/fuzzysearch/blob/master/index.js
    fuzzySearch: function(needle, haystack) {
      var hlen = haystack.length;
      var nlen = needle.length;
      if (nlen > hlen) {
        return false;
      }
      if (nlen === hlen) {
        return needle === haystack;
      }
      outer: for (var i = 0, j = 0; i < nlen; i++) {
        var nch = needle.charCodeAt(i);
        while (j < hlen) {
          if (haystack.charCodeAt(j++) === nch) {
            continue outer;
          }
        }
        return false;
      }
      return true;
    }
  };

  // App object to store all app related methods
  var App = {
    currentSourceName: '',
    currentArticles: [],
    allArticles: [],
    init: function() {
      // Methods that need to be called on initialization
      this.bindEvents();
      this.populateDropdown(SOURCES);
      this.showDefaultFeed(SOURCES);
    },
    bindEvents: function() {
      // Attach event listeners
      $('#main').on('click', '.article a', this.showPopup.bind(this));
      $('.closePopUp').on('click', this.closePopUp.bind(this));
      $('.sources-dropdown').on('click', 'a', this.showSelectedFeed.bind(this));
      $('#search a').on('click', this.toggleSearchInput.bind(this));
      $('#search input').on('keyup', _.debounce(this.filterSearch, 600).bind(this));
      $('.logo').on('click', this.showDefaultFeed.bind(this));
    },
    showDefaultFeed: function(sources) {
      this.allArticles = [];
      var ajaxRequests = _.map(SOURCES, function(source) {
        // returns invokation of Ajax method, jqXHR object
        return this.requestFeed(source);
      }.bind(this));
      $.when.apply($, ajaxRequests).done(function() {
        var responses = arguments;
        _.each(responses, function(response, index) {
          var formatted = SOURCES[index].formatResponse(response[0]);
          _.each(formatted, function(article) {
            App.allArticles.push(article);
          });
        }.bind(this));
        _.each(this.allArticles, function(article) {
          if (typeof article.date === 'string') {
            article.date = moment(article.date).unix();
          }
        });
        this.allArticles = _.sortBy(this.allArticles, 'date');
        this.renderArticles(this.allArticles);
        this.currentSourceName = 'Aggregate';
        this.renderSourceName(this.currentSourceName);
      }.bind(this));
    },
    showSelectedFeed: function(event) {
      event.preventDefault();
      this.currentSourceName = $(event.target).html();
      var sourceId = _.findWhere(SOURCES, {
        displayName: this.currentSourceName
      });
      this.showFeed(sourceId);
    },
    showFeed: function(source) {
      var request = this.requestFeed(source);
      request.done(function(response) {
        var currentSourceName = source.displayName;
        var currentArticles = source.formatResponse(response);
        this.currentSourceName = currentSourceName;
        this.currentArticles = currentArticles;
        this.renderArticles(currentArticles);
        this.renderSourceName(currentSourceName);
      }.bind(this));
      // add in fail scenario
      request.fail(function(response) {
        alert(response.responseText);
      }.bind(this));
    },
    requestFeed: function(source){
      var url = source.proxyRequired ? PROXY_URL + source.url : source.url;
      this.setView('loader');
      return $.ajax(url, {
        dataType: 'json'
      });
    },
    renderArticles: function(articles) {
      this.setView('feed');
      var articlesHTML = Utils.markupFromArticles(articles);
      $("#main").html(articlesHTML);
    },
    renderSourceName: function(sourceName) {
      $('.source-name').html(sourceName);
    },
    populateDropdown: function(sources) {
      _.each(sources, function(source) {
        var sourceMarkup = _.template('<li><a href="#"><%= displayName %></a></li>');
        var singleSource = sourceMarkup(source);
        $('.sources-dropdown').append(singleSource);
      });
    },
    setView: function(viewType) {
      var $popup = $('#popUp');
      var $closePopUp = $('.closePopUp');

      if (viewType === 'loader') {
        $popup.removeClass('hidden');
        $closePopUp.addClass('hidden');
        $popup.addClass('loader');
      }
      else if (viewType === 'detail') {
        $popup.removeClass('hidden');
        $closePopUp.removeClass('hidden');
        $popup.removeClass('loader');
      }
      else if (viewType === 'feed') {
        $popup.addClass('hidden');
        $closePopUp.addClass('hidden');
      }
    },
    showPopup: function(event) {
      event.preventDefault();
      this.setView('detail');
      var href = $(event.target).closest('a').attr('href');
      var title = $(event.target).html();
      var subtitle = $(event.target).closest('a').attr('data-description');
      $('h1').not('.logo').html(title);
      $('p').html(subtitle);
      $('a.popUpAction').attr('href', href);
    },
    closePopUp: function() {
      $('.popup-container').html();
      this.setView('feed');
    },
    toggleSearchInput: function(event) {
      $(event.target).closest('#search').toggleClass('active');
      $(event.target).closest('#search').find('input').focus();
    },
    filterSearch: function(event) {
      var enterKey = 13;
      var escKey = 27;
      var sourceName = $('.source-name').html();
      var resultArr = [];
      var filterVal = $(event.target).val();
      if ((event.keyCode === enterKey) || (event.keyCode === escKey)) {
        $(event.target).closest('#search').toggleClass('active');
      } else {
        if (filterVal !== '') {
          $('.article').each(function(i) {
            var title = $(this).find('h3').html();
            var result = Utils.fuzzySearch(filterVal, title);
            if (result) {
              resultArr.push(this.outerHTML);
            }
          });
          $('#main').html('');
          _.each(resultArr, function(article) {
            $('#main').append(article);
          });
        } else { // When the input box is cleared, all articles (unfiltered) should display in the respective feed.
          $('#main').html('');
          if (sourceName === 'Aggregate') {
            this.renderArticles(this.allArticles);
          } else {
            this.renderArticles(this.currentArticles);
          }
        }
      }
    }
  };

  App.init();
});
