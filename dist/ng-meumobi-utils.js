/* global angular, localStorage */
/* eslint no-undef: "error" */
(function () {
  'use strict';

  angular
  .module('ngMeumobi.Utils.services', [])
  .provider('Poll', Poll);

  function Poll() {
    /*
      TODO: Should be meuAPIServices agnostic
    */
    this.$get = ["$q", "API", "$log", function ($q, API, $log) {
      var api = {};
      var polls = {};
      /**
      * Api methods, available only on the inside the service
      */

      //get localstorage polls
      api.polls = function () {
        if (!Object.keys(polls).length && localStorage.polls)
         polls = angular.fromJson(localStorage.polls);
        return polls;
      },
      
      //add poll to localstorage
      api.addPoll = function (poll) {
        polls[poll._id] = poll;
        localStorage.polls = angular.toJson(polls);
      },

      api.removePolls = function () {

      },

      api.vote = function () {

      },

      api.hasExpired = function (date) {
        var now = Date.now();
        var end_date = date * 1000; // convert sec. to ms
        var hasExpired = (now - end_date) > 0;

        return hasExpired;
      },

      api.hasVoted = function (poll) {
        var hasVoted = poll.voted !== null || !!api.polls()[poll._id];

        $log.debug('Poll is voted [Object]' + (poll.voted !== null));
        $log.debug('Poll is voted [locaStorage]' + !!api.polls()[poll._id]);
        $log.debug('Has voted ? ' + hasVoted);

        return hasVoted;
      },

      api.paramify = function (poll) {
        var values = {};
        var obj = {};

        values.value = poll.values;
        obj.params = values;
        obj.id = poll._id;

        return obj;
      },

      api.computeResults = function (poll) {
        var results = [];
        var result = {};
        var total = api.totalVotes(poll);
        $log.debug('Total votes: ' + total);
        // $log.debug(poll.voted);

        for (var x in poll.results) {
          /**
          * Should ignore if value is "_"
          * For more details see https://github.com/meumobi/sitebuilder/issues/351
          */
          if (!isNaN(poll.results[x].value)) {
            result = poll.results[x];
            result.myVote = (poll.voted !== null) ? poll.voted.values.hasOwnProperty(x) : false;
            result.label = poll.options[result.value];
            result.ratio = (total !== 0) ? (parseInt(poll.results[x].votes) / total) * 100 + '%' : '0%';
            results.push(result);
          }
        }

        return results;
      },

      api.totalVotes = function (poll) {
        var total = 0;
        for (var x in poll.results) {
          total += poll.results[x].votes;
        }

        return total;
      };
      
      /**
      * Service methods, that are public and available for any resource
      */
      return {
        statuses: {
          open: 'open',
          closed: 'closed',
          voted: 'voted'
        },
        get: function (poll) {
          $log.debug('===== Poll: ' + poll.title);
          var status = this.getStatus(poll);
          
          /*
            load poll from localstorage if voted but feed hasn't been reloaded from server
          On reload polls previously saved on localstorage are erased
          */
          if (status == this.statuses.voted && !!api.polls()[poll._id]) {
            poll = api.polls()[poll._id];
            $log.debug('Poll loaded from localStorage');
          } else {
            poll.status = status;
            poll.total = api.totalVotes(poll);
          }

          if (poll.status !== this.statuses.open) {
            poll.results = api.computeResults(poll);
          }

          return poll;
        },

        getStatus: function (poll) {
          var statuses = this.statuses;

          var status = statuses.open;
          if (api.hasExpired(poll.end_date)) {
            status = statuses.closed;
          } else if (api.hasVoted(poll)) {
            status = statuses.voted;
          }

          $log.debug('Get Status: ' + status);
          return status;
        },

        vote: function (poll) {

          var deferred = $q.defer();
          var statuses = this.statuses;

          var vote = {
            success: function (response) {
              $log.debug(response);
              UtilsService.toast(translateFilter('poll.vote.Success'));
              poll.status = statuses.voted;
              poll.total = api.totalVotes(response.data);
              poll.results = api.computeResults(response.data);
              poll.voted = response.data.voted;
              poll.status = statuses.voted;
              api.addPoll(poll);
              deferred.resolve(poll);
            },

            error: function (response) {
              var msg = translateFilter('poll.vote.Error');
              if (response.data && response.data.error) {
                msg += ': ' + translateFilter('[API]: ' + response.data.error);
              } else {
                msg += ': ' + translateFilter('default.network.Error');
              }

              UtilsService.toast(msg);
              $log.debug(msg);
              deferred.reject(response.data);
            }
          };

          API.Poll.submit(api.paramify(poll), vote.success, vote.error);

          return deferred.promise;
        }
      };
    }];
  }
})();

/*global angular, cordova*/
/*eslint no-undef: "error"*/
(function () {
  'use strict';

  angular.module('ngMeumobi.Utils.services', [])
  /*
    TODO: Remove useless injections
  */
  .factory('meuFilesServices', ['$log', '$location', '$q', meuFilesServices]);

  function meuFilesServices($log, $location, $q) {
    var service = {};

    service.open = open;

    return service;

    // install   :      cordova plugin add https://github.com/pwlin/cordova-plugin-file-opener2.git
    // link      :      https://github.com/pwlin/cordova-plugin-file-opener2

    function open(uri, type) {
      var q = $q.defer();
      cordova.plugins.fileOpener2.open(uri, type, {
        error: function (e) {
          /*
            To homogeneize Android and iOS responses
          */
          if (e.message == 'File doest not exist') {
            e.message = 'File not found';
          } else {
            e.message = "Couldn't open this file. No handler found on device for " . type;
          }

          q.reject(e);
        }, success: function () {

          q.resolve();
        }
      });
      return q.promise;
    }
  }
})();


/* global angular */
/* eslint no-undef: "error" */
(function () {
  'use strict';

  angular.module('ngMeumobi.Utils.filters', [])
  .filter('isEmpty', isEmpty)
  .filter('br2nl', br2nl)
  .filter('striptags', striptags);

  function isEmpty() {
    return function (obj) {
      return !Object.keys(obj).length;
    };
  }

  function br2nl() {
    return function (text) {
      return text.replace(/<br\s*[\/]?>/gi, '\n');
    };
  }

  function striptags() {
    return function (text) {
      return angular
          .element('<div/>')
          .html(text)
          .text();
    };
  }
})();

/* global angular */
/* eslint no-undef: "error" */
/*
  TODO: should release minified (.min.js) and not (.js)
*/
(function () {
  'use strict';

  angular.module('ngMeumobi.Utils', [
    'ngMeumobi.Utils.services',
    'ngMeumobi.Utils.filters'
  ]);
})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlcnZpY2VzL1BvbGxzX21ldW1vYmkuc2VydmljZXMuanMiLCJzZXJ2aWNlcy9GaWxlc19tZXVtb2JpLnNlcnZpY2VzLmpzIiwiZmlsdGVycy9tZXUtZmlsdGVycy5qcyIsIm1vZHVsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQSxDQUFBLFlBQUE7RUFDQTs7RUFFQTtHQUNBLE9BQUEsNEJBQUE7R0FDQSxTQUFBLFFBQUE7O0VBRUEsU0FBQSxPQUFBOzs7O0lBSUEsS0FBQSw2QkFBQSxVQUFBLElBQUEsS0FBQSxNQUFBO01BQ0EsSUFBQSxNQUFBO01BQ0EsSUFBQSxRQUFBOzs7Ozs7TUFNQSxJQUFBLFFBQUEsWUFBQTtRQUNBLElBQUEsQ0FBQSxPQUFBLEtBQUEsT0FBQSxVQUFBLGFBQUE7U0FDQSxRQUFBLFFBQUEsU0FBQSxhQUFBO1FBQ0EsT0FBQTs7OztNQUlBLElBQUEsVUFBQSxVQUFBLE1BQUE7UUFDQSxNQUFBLEtBQUEsT0FBQTtRQUNBLGFBQUEsUUFBQSxRQUFBLE9BQUE7OztNQUdBLElBQUEsY0FBQSxZQUFBOzs7O01BSUEsSUFBQSxPQUFBLFlBQUE7Ozs7TUFJQSxJQUFBLGFBQUEsVUFBQSxNQUFBO1FBQ0EsSUFBQSxNQUFBLEtBQUE7UUFDQSxJQUFBLFdBQUEsT0FBQTtRQUNBLElBQUEsYUFBQSxDQUFBLE1BQUEsWUFBQTs7UUFFQSxPQUFBOzs7TUFHQSxJQUFBLFdBQUEsVUFBQSxNQUFBO1FBQ0EsSUFBQSxXQUFBLEtBQUEsVUFBQSxRQUFBLENBQUEsQ0FBQSxJQUFBLFFBQUEsS0FBQTs7UUFFQSxLQUFBLE1BQUEsNEJBQUEsS0FBQSxVQUFBO1FBQ0EsS0FBQSxNQUFBLGdDQUFBLENBQUEsQ0FBQSxJQUFBLFFBQUEsS0FBQTtRQUNBLEtBQUEsTUFBQSxpQkFBQTs7UUFFQSxPQUFBOzs7TUFHQSxJQUFBLFdBQUEsVUFBQSxNQUFBO1FBQ0EsSUFBQSxTQUFBO1FBQ0EsSUFBQSxNQUFBOztRQUVBLE9BQUEsUUFBQSxLQUFBO1FBQ0EsSUFBQSxTQUFBO1FBQ0EsSUFBQSxLQUFBLEtBQUE7O1FBRUEsT0FBQTs7O01BR0EsSUFBQSxpQkFBQSxVQUFBLE1BQUE7UUFDQSxJQUFBLFVBQUE7UUFDQSxJQUFBLFNBQUE7UUFDQSxJQUFBLFFBQUEsSUFBQSxXQUFBO1FBQ0EsS0FBQSxNQUFBLGtCQUFBOzs7UUFHQSxLQUFBLElBQUEsS0FBQSxLQUFBLFNBQUE7Ozs7O1VBS0EsSUFBQSxDQUFBLE1BQUEsS0FBQSxRQUFBLEdBQUEsUUFBQTtZQUNBLFNBQUEsS0FBQSxRQUFBO1lBQ0EsT0FBQSxTQUFBLENBQUEsS0FBQSxVQUFBLFFBQUEsS0FBQSxNQUFBLE9BQUEsZUFBQSxLQUFBO1lBQ0EsT0FBQSxRQUFBLEtBQUEsUUFBQSxPQUFBO1lBQ0EsT0FBQSxRQUFBLENBQUEsVUFBQSxLQUFBLENBQUEsU0FBQSxLQUFBLFFBQUEsR0FBQSxTQUFBLFNBQUEsTUFBQSxNQUFBO1lBQ0EsUUFBQSxLQUFBOzs7O1FBSUEsT0FBQTs7O01BR0EsSUFBQSxhQUFBLFVBQUEsTUFBQTtRQUNBLElBQUEsUUFBQTtRQUNBLEtBQUEsSUFBQSxLQUFBLEtBQUEsU0FBQTtVQUNBLFNBQUEsS0FBQSxRQUFBLEdBQUE7OztRQUdBLE9BQUE7Ozs7OztNQU1BLE9BQUE7UUFDQSxVQUFBO1VBQ0EsTUFBQTtVQUNBLFFBQUE7VUFDQSxPQUFBOztRQUVBLEtBQUEsVUFBQSxNQUFBO1VBQ0EsS0FBQSxNQUFBLGlCQUFBLEtBQUE7VUFDQSxJQUFBLFNBQUEsS0FBQSxVQUFBOzs7Ozs7VUFNQSxJQUFBLFVBQUEsS0FBQSxTQUFBLFNBQUEsQ0FBQSxDQUFBLElBQUEsUUFBQSxLQUFBLE1BQUE7WUFDQSxPQUFBLElBQUEsUUFBQSxLQUFBO1lBQ0EsS0FBQSxNQUFBO2lCQUNBO1lBQ0EsS0FBQSxTQUFBO1lBQ0EsS0FBQSxRQUFBLElBQUEsV0FBQTs7O1VBR0EsSUFBQSxLQUFBLFdBQUEsS0FBQSxTQUFBLE1BQUE7WUFDQSxLQUFBLFVBQUEsSUFBQSxlQUFBOzs7VUFHQSxPQUFBOzs7UUFHQSxXQUFBLFVBQUEsTUFBQTtVQUNBLElBQUEsV0FBQSxLQUFBOztVQUVBLElBQUEsU0FBQSxTQUFBO1VBQ0EsSUFBQSxJQUFBLFdBQUEsS0FBQSxXQUFBO1lBQ0EsU0FBQSxTQUFBO2lCQUNBLElBQUEsSUFBQSxTQUFBLE9BQUE7WUFDQSxTQUFBLFNBQUE7OztVQUdBLEtBQUEsTUFBQSxpQkFBQTtVQUNBLE9BQUE7OztRQUdBLE1BQUEsVUFBQSxNQUFBOztVQUVBLElBQUEsV0FBQSxHQUFBO1VBQ0EsSUFBQSxXQUFBLEtBQUE7O1VBRUEsSUFBQSxPQUFBO1lBQ0EsU0FBQSxVQUFBLFVBQUE7Y0FDQSxLQUFBLE1BQUE7Y0FDQSxhQUFBLE1BQUEsZ0JBQUE7Y0FDQSxLQUFBLFNBQUEsU0FBQTtjQUNBLEtBQUEsUUFBQSxJQUFBLFdBQUEsU0FBQTtjQUNBLEtBQUEsVUFBQSxJQUFBLGVBQUEsU0FBQTtjQUNBLEtBQUEsUUFBQSxTQUFBLEtBQUE7Y0FDQSxLQUFBLFNBQUEsU0FBQTtjQUNBLElBQUEsUUFBQTtjQUNBLFNBQUEsUUFBQTs7O1lBR0EsT0FBQSxVQUFBLFVBQUE7Y0FDQSxJQUFBLE1BQUEsZ0JBQUE7Y0FDQSxJQUFBLFNBQUEsUUFBQSxTQUFBLEtBQUEsT0FBQTtnQkFDQSxPQUFBLE9BQUEsZ0JBQUEsWUFBQSxTQUFBLEtBQUE7cUJBQ0E7Z0JBQ0EsT0FBQSxPQUFBLGdCQUFBOzs7Y0FHQSxhQUFBLE1BQUE7Y0FDQSxLQUFBLE1BQUE7Y0FDQSxTQUFBLE9BQUEsU0FBQTs7OztVQUlBLElBQUEsS0FBQSxPQUFBLElBQUEsU0FBQSxPQUFBLEtBQUEsU0FBQSxLQUFBOztVQUVBLE9BQUEsU0FBQTs7Ozs7Ozs7O0FDckxBLENBQUEsWUFBQTtFQUNBOztFQUVBLFFBQUEsT0FBQSw0QkFBQTs7OztHQUlBLFFBQUEsb0JBQUEsQ0FBQSxRQUFBLGFBQUEsTUFBQTs7RUFFQSxTQUFBLGlCQUFBLE1BQUEsV0FBQSxJQUFBO0lBQ0EsSUFBQSxVQUFBOztJQUVBLFFBQUEsT0FBQTs7SUFFQSxPQUFBOzs7OztJQUtBLFNBQUEsS0FBQSxLQUFBLE1BQUE7TUFDQSxJQUFBLElBQUEsR0FBQTtNQUNBLFFBQUEsUUFBQSxZQUFBLEtBQUEsS0FBQSxNQUFBO1FBQ0EsT0FBQSxVQUFBLEdBQUE7Ozs7VUFJQSxJQUFBLEVBQUEsV0FBQSx3QkFBQTtZQUNBLEVBQUEsVUFBQTtpQkFDQTtZQUNBLEVBQUEsVUFBQSw2REFBQTs7O1VBR0EsRUFBQSxPQUFBO1dBQ0EsU0FBQSxZQUFBOztVQUVBLEVBQUE7OztNQUdBLE9BQUEsRUFBQTs7Ozs7Ozs7QUN0Q0EsQ0FBQSxZQUFBO0VBQ0E7O0VBRUEsUUFBQSxPQUFBLDJCQUFBO0dBQ0EsT0FBQSxXQUFBO0dBQ0EsT0FBQSxTQUFBO0dBQ0EsT0FBQSxhQUFBOztFQUVBLFNBQUEsVUFBQTtJQUNBLE9BQUEsVUFBQSxLQUFBO01BQ0EsT0FBQSxDQUFBLE9BQUEsS0FBQSxLQUFBOzs7O0VBSUEsU0FBQSxRQUFBO0lBQ0EsT0FBQSxVQUFBLE1BQUE7TUFDQSxPQUFBLEtBQUEsUUFBQSxrQkFBQTs7OztFQUlBLFNBQUEsWUFBQTtJQUNBLE9BQUEsVUFBQSxNQUFBO01BQ0EsT0FBQTtXQUNBLFFBQUE7V0FDQSxLQUFBO1dBQ0E7Ozs7Ozs7Ozs7QUN0QkEsQ0FBQSxZQUFBO0VBQ0E7O0VBRUEsUUFBQSxPQUFBLG1CQUFBO0lBQ0E7SUFDQTs7O0FBR0EiLCJmaWxlIjoibmctbWV1bW9iaS11dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBhbmd1bGFyLCBsb2NhbFN0b3JhZ2UgKi9cbi8qIGVzbGludCBuby11bmRlZjogXCJlcnJvclwiICovXG4oZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhclxuICAubW9kdWxlKCduZ01ldW1vYmkuVXRpbHMuc2VydmljZXMnLCBbXSlcbiAgLnByb3ZpZGVyKCdQb2xsJywgUG9sbCk7XG5cbiAgZnVuY3Rpb24gUG9sbCgpIHtcbiAgICAvKlxuICAgICAgVE9ETzogU2hvdWxkIGJlIG1ldUFQSVNlcnZpY2VzIGFnbm9zdGljXG4gICAgKi9cbiAgICB0aGlzLiRnZXQgPSBmdW5jdGlvbiAoJHEsIEFQSSwgJGxvZykge1xuICAgICAgdmFyIGFwaSA9IHt9O1xuICAgICAgdmFyIHBvbGxzID0ge307XG4gICAgICAvKipcbiAgICAgICogQXBpIG1ldGhvZHMsIGF2YWlsYWJsZSBvbmx5IG9uIHRoZSBpbnNpZGUgdGhlIHNlcnZpY2VcbiAgICAgICovXG5cbiAgICAgIC8vZ2V0IGxvY2Fsc3RvcmFnZSBwb2xsc1xuICAgICAgYXBpLnBvbGxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIU9iamVjdC5rZXlzKHBvbGxzKS5sZW5ndGggJiYgbG9jYWxTdG9yYWdlLnBvbGxzKVxuICAgICAgICAgcG9sbHMgPSBhbmd1bGFyLmZyb21Kc29uKGxvY2FsU3RvcmFnZS5wb2xscyk7XG4gICAgICAgIHJldHVybiBwb2xscztcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vYWRkIHBvbGwgdG8gbG9jYWxzdG9yYWdlXG4gICAgICBhcGkuYWRkUG9sbCA9IGZ1bmN0aW9uIChwb2xsKSB7XG4gICAgICAgIHBvbGxzW3BvbGwuX2lkXSA9IHBvbGw7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5wb2xscyA9IGFuZ3VsYXIudG9Kc29uKHBvbGxzKTtcbiAgICAgIH0sXG5cbiAgICAgIGFwaS5yZW1vdmVQb2xscyA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgfSxcblxuICAgICAgYXBpLnZvdGUgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIH0sXG5cbiAgICAgIGFwaS5oYXNFeHBpcmVkID0gZnVuY3Rpb24gKGRhdGUpIHtcbiAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIHZhciBlbmRfZGF0ZSA9IGRhdGUgKiAxMDAwOyAvLyBjb252ZXJ0IHNlYy4gdG8gbXNcbiAgICAgICAgdmFyIGhhc0V4cGlyZWQgPSAobm93IC0gZW5kX2RhdGUpID4gMDtcblxuICAgICAgICByZXR1cm4gaGFzRXhwaXJlZDtcbiAgICAgIH0sXG5cbiAgICAgIGFwaS5oYXNWb3RlZCA9IGZ1bmN0aW9uIChwb2xsKSB7XG4gICAgICAgIHZhciBoYXNWb3RlZCA9IHBvbGwudm90ZWQgIT09IG51bGwgfHwgISFhcGkucG9sbHMoKVtwb2xsLl9pZF07XG5cbiAgICAgICAgJGxvZy5kZWJ1ZygnUG9sbCBpcyB2b3RlZCBbT2JqZWN0XScgKyAocG9sbC52b3RlZCAhPT0gbnVsbCkpO1xuICAgICAgICAkbG9nLmRlYnVnKCdQb2xsIGlzIHZvdGVkIFtsb2NhU3RvcmFnZV0nICsgISFhcGkucG9sbHMoKVtwb2xsLl9pZF0pO1xuICAgICAgICAkbG9nLmRlYnVnKCdIYXMgdm90ZWQgPyAnICsgaGFzVm90ZWQpO1xuXG4gICAgICAgIHJldHVybiBoYXNWb3RlZDtcbiAgICAgIH0sXG5cbiAgICAgIGFwaS5wYXJhbWlmeSA9IGZ1bmN0aW9uIChwb2xsKSB7XG4gICAgICAgIHZhciB2YWx1ZXMgPSB7fTtcbiAgICAgICAgdmFyIG9iaiA9IHt9O1xuXG4gICAgICAgIHZhbHVlcy52YWx1ZSA9IHBvbGwudmFsdWVzO1xuICAgICAgICBvYmoucGFyYW1zID0gdmFsdWVzO1xuICAgICAgICBvYmouaWQgPSBwb2xsLl9pZDtcblxuICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgfSxcblxuICAgICAgYXBpLmNvbXB1dGVSZXN1bHRzID0gZnVuY3Rpb24gKHBvbGwpIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICB2YXIgdG90YWwgPSBhcGkudG90YWxWb3Rlcyhwb2xsKTtcbiAgICAgICAgJGxvZy5kZWJ1ZygnVG90YWwgdm90ZXM6ICcgKyB0b3RhbCk7XG4gICAgICAgIC8vICRsb2cuZGVidWcocG9sbC52b3RlZCk7XG5cbiAgICAgICAgZm9yICh2YXIgeCBpbiBwb2xsLnJlc3VsdHMpIHtcbiAgICAgICAgICAvKipcbiAgICAgICAgICAqIFNob3VsZCBpZ25vcmUgaWYgdmFsdWUgaXMgXCJfXCJcbiAgICAgICAgICAqIEZvciBtb3JlIGRldGFpbHMgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tZXVtb2JpL3NpdGVidWlsZGVyL2lzc3Vlcy8zNTFcbiAgICAgICAgICAqL1xuICAgICAgICAgIGlmICghaXNOYU4ocG9sbC5yZXN1bHRzW3hdLnZhbHVlKSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gcG9sbC5yZXN1bHRzW3hdO1xuICAgICAgICAgICAgcmVzdWx0Lm15Vm90ZSA9IChwb2xsLnZvdGVkICE9PSBudWxsKSA/IHBvbGwudm90ZWQudmFsdWVzLmhhc093blByb3BlcnR5KHgpIDogZmFsc2U7XG4gICAgICAgICAgICByZXN1bHQubGFiZWwgPSBwb2xsLm9wdGlvbnNbcmVzdWx0LnZhbHVlXTtcbiAgICAgICAgICAgIHJlc3VsdC5yYXRpbyA9ICh0b3RhbCAhPT0gMCkgPyAocGFyc2VJbnQocG9sbC5yZXN1bHRzW3hdLnZvdGVzKSAvIHRvdGFsKSAqIDEwMCArICclJyA6ICcwJSc7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgIH0sXG5cbiAgICAgIGFwaS50b3RhbFZvdGVzID0gZnVuY3Rpb24gKHBvbGwpIHtcbiAgICAgICAgdmFyIHRvdGFsID0gMDtcbiAgICAgICAgZm9yICh2YXIgeCBpbiBwb2xsLnJlc3VsdHMpIHtcbiAgICAgICAgICB0b3RhbCArPSBwb2xsLnJlc3VsdHNbeF0udm90ZXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdG90YWw7XG4gICAgICB9O1xuICAgICAgXG4gICAgICAvKipcbiAgICAgICogU2VydmljZSBtZXRob2RzLCB0aGF0IGFyZSBwdWJsaWMgYW5kIGF2YWlsYWJsZSBmb3IgYW55IHJlc291cmNlXG4gICAgICAqL1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzZXM6IHtcbiAgICAgICAgICBvcGVuOiAnb3BlbicsXG4gICAgICAgICAgY2xvc2VkOiAnY2xvc2VkJyxcbiAgICAgICAgICB2b3RlZDogJ3ZvdGVkJ1xuICAgICAgICB9LFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChwb2xsKSB7XG4gICAgICAgICAgJGxvZy5kZWJ1ZygnPT09PT0gUG9sbDogJyArIHBvbGwudGl0bGUpO1xuICAgICAgICAgIHZhciBzdGF0dXMgPSB0aGlzLmdldFN0YXR1cyhwb2xsKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvKlxuICAgICAgICAgICAgbG9hZCBwb2xsIGZyb20gbG9jYWxzdG9yYWdlIGlmIHZvdGVkIGJ1dCBmZWVkIGhhc24ndCBiZWVuIHJlbG9hZGVkIGZyb20gc2VydmVyXG4gICAgICAgICAgT24gcmVsb2FkIHBvbGxzIHByZXZpb3VzbHkgc2F2ZWQgb24gbG9jYWxzdG9yYWdlIGFyZSBlcmFzZWRcbiAgICAgICAgICAqL1xuICAgICAgICAgIGlmIChzdGF0dXMgPT0gdGhpcy5zdGF0dXNlcy52b3RlZCAmJiAhIWFwaS5wb2xscygpW3BvbGwuX2lkXSkge1xuICAgICAgICAgICAgcG9sbCA9IGFwaS5wb2xscygpW3BvbGwuX2lkXTtcbiAgICAgICAgICAgICRsb2cuZGVidWcoJ1BvbGwgbG9hZGVkIGZyb20gbG9jYWxTdG9yYWdlJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBvbGwuc3RhdHVzID0gc3RhdHVzO1xuICAgICAgICAgICAgcG9sbC50b3RhbCA9IGFwaS50b3RhbFZvdGVzKHBvbGwpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChwb2xsLnN0YXR1cyAhPT0gdGhpcy5zdGF0dXNlcy5vcGVuKSB7XG4gICAgICAgICAgICBwb2xsLnJlc3VsdHMgPSBhcGkuY29tcHV0ZVJlc3VsdHMocG9sbCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHBvbGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0U3RhdHVzOiBmdW5jdGlvbiAocG9sbCkge1xuICAgICAgICAgIHZhciBzdGF0dXNlcyA9IHRoaXMuc3RhdHVzZXM7XG5cbiAgICAgICAgICB2YXIgc3RhdHVzID0gc3RhdHVzZXMub3BlbjtcbiAgICAgICAgICBpZiAoYXBpLmhhc0V4cGlyZWQocG9sbC5lbmRfZGF0ZSkpIHtcbiAgICAgICAgICAgIHN0YXR1cyA9IHN0YXR1c2VzLmNsb3NlZDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFwaS5oYXNWb3RlZChwb2xsKSkge1xuICAgICAgICAgICAgc3RhdHVzID0gc3RhdHVzZXMudm90ZWQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgJGxvZy5kZWJ1ZygnR2V0IFN0YXR1czogJyArIHN0YXR1cyk7XG4gICAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICAgICAgfSxcblxuICAgICAgICB2b3RlOiBmdW5jdGlvbiAocG9sbCkge1xuXG4gICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICB2YXIgc3RhdHVzZXMgPSB0aGlzLnN0YXR1c2VzO1xuXG4gICAgICAgICAgdmFyIHZvdGUgPSB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgJGxvZy5kZWJ1ZyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgIFV0aWxzU2VydmljZS50b2FzdCh0cmFuc2xhdGVGaWx0ZXIoJ3BvbGwudm90ZS5TdWNjZXNzJykpO1xuICAgICAgICAgICAgICBwb2xsLnN0YXR1cyA9IHN0YXR1c2VzLnZvdGVkO1xuICAgICAgICAgICAgICBwb2xsLnRvdGFsID0gYXBpLnRvdGFsVm90ZXMocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgIHBvbGwucmVzdWx0cyA9IGFwaS5jb21wdXRlUmVzdWx0cyhyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgcG9sbC52b3RlZCA9IHJlc3BvbnNlLmRhdGEudm90ZWQ7XG4gICAgICAgICAgICAgIHBvbGwuc3RhdHVzID0gc3RhdHVzZXMudm90ZWQ7XG4gICAgICAgICAgICAgIGFwaS5hZGRQb2xsKHBvbGwpO1xuICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHBvbGwpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICB2YXIgbXNnID0gdHJhbnNsYXRlRmlsdGVyKCdwb2xsLnZvdGUuRXJyb3InKTtcbiAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5lcnJvcikge1xuICAgICAgICAgICAgICAgIG1zZyArPSAnOiAnICsgdHJhbnNsYXRlRmlsdGVyKCdbQVBJXTogJyArIHJlc3BvbnNlLmRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1zZyArPSAnOiAnICsgdHJhbnNsYXRlRmlsdGVyKCdkZWZhdWx0Lm5ldHdvcmsuRXJyb3InKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIFV0aWxzU2VydmljZS50b2FzdChtc2cpO1xuICAgICAgICAgICAgICAkbG9nLmRlYnVnKG1zZyk7XG4gICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgQVBJLlBvbGwuc3VibWl0KGFwaS5wYXJhbWlmeShwb2xsKSwgdm90ZS5zdWNjZXNzLCB2b3RlLmVycm9yKTtcblxuICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH07XG4gIH1cbn0pKCk7XG4iLCIvKmdsb2JhbCBhbmd1bGFyLCBjb3Jkb3ZhKi9cbi8qZXNsaW50IG5vLXVuZGVmOiBcImVycm9yXCIqL1xuKGZ1bmN0aW9uICgpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGFuZ3VsYXIubW9kdWxlKCduZ01ldW1vYmkuVXRpbHMuc2VydmljZXMnLCBbXSlcbiAgLypcbiAgICBUT0RPOiBSZW1vdmUgdXNlbGVzcyBpbmplY3Rpb25zXG4gICovXG4gIC5mYWN0b3J5KCdtZXVGaWxlc1NlcnZpY2VzJywgWyckbG9nJywgJyRsb2NhdGlvbicsICckcScsIG1ldUZpbGVzU2VydmljZXNdKTtcblxuICBmdW5jdGlvbiBtZXVGaWxlc1NlcnZpY2VzKCRsb2csICRsb2NhdGlvbiwgJHEpIHtcbiAgICB2YXIgc2VydmljZSA9IHt9O1xuXG4gICAgc2VydmljZS5vcGVuID0gb3BlbjtcblxuICAgIHJldHVybiBzZXJ2aWNlO1xuXG4gICAgLy8gaW5zdGFsbCAgIDogICAgICBjb3Jkb3ZhIHBsdWdpbiBhZGQgaHR0cHM6Ly9naXRodWIuY29tL3B3bGluL2NvcmRvdmEtcGx1Z2luLWZpbGUtb3BlbmVyMi5naXRcbiAgICAvLyBsaW5rICAgICAgOiAgICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9wd2xpbi9jb3Jkb3ZhLXBsdWdpbi1maWxlLW9wZW5lcjJcblxuICAgIGZ1bmN0aW9uIG9wZW4odXJpLCB0eXBlKSB7XG4gICAgICB2YXIgcSA9ICRxLmRlZmVyKCk7XG4gICAgICBjb3Jkb3ZhLnBsdWdpbnMuZmlsZU9wZW5lcjIub3Blbih1cmksIHR5cGUsIHtcbiAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgLypcbiAgICAgICAgICAgIFRvIGhvbW9nZW5laXplIEFuZHJvaWQgYW5kIGlPUyByZXNwb25zZXNcbiAgICAgICAgICAqL1xuICAgICAgICAgIGlmIChlLm1lc3NhZ2UgPT0gJ0ZpbGUgZG9lc3Qgbm90IGV4aXN0Jykge1xuICAgICAgICAgICAgZS5tZXNzYWdlID0gJ0ZpbGUgbm90IGZvdW5kJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZS5tZXNzYWdlID0gXCJDb3VsZG4ndCBvcGVuIHRoaXMgZmlsZS4gTm8gaGFuZGxlciBmb3VuZCBvbiBkZXZpY2UgZm9yIFwiIC4gdHlwZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBxLnJlamVjdChlKTtcbiAgICAgICAgfSwgc3VjY2VzczogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgcS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHEucHJvbWlzZTtcbiAgICB9XG4gIH1cbn0pKCk7XG4iLCIvKiBnbG9iYWwgYW5ndWxhciAqL1xuLyogZXNsaW50IG5vLXVuZGVmOiBcImVycm9yXCIgKi9cbihmdW5jdGlvbiAoKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBhbmd1bGFyLm1vZHVsZSgnbmdNZXVtb2JpLlV0aWxzLmZpbHRlcnMnLCBbXSlcbiAgLmZpbHRlcignaXNFbXB0eScsIGlzRW1wdHkpXG4gIC5maWx0ZXIoJ2JyMm5sJywgYnIybmwpXG4gIC5maWx0ZXIoJ3N0cmlwdGFncycsIHN0cmlwdGFncyk7XG5cbiAgZnVuY3Rpb24gaXNFbXB0eSgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuICFPYmplY3Qua2V5cyhvYmopLmxlbmd0aDtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gYnIybmwoKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgICByZXR1cm4gdGV4dC5yZXBsYWNlKC88YnJcXHMqW1xcL10/Pi9naSwgJ1xcbicpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBzdHJpcHRhZ3MoKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgICByZXR1cm4gYW5ndWxhclxuICAgICAgICAgIC5lbGVtZW50KCc8ZGl2Lz4nKVxuICAgICAgICAgIC5odG1sKHRleHQpXG4gICAgICAgICAgLnRleHQoKTtcbiAgICB9O1xuICB9XG59KSgpO1xuIiwiLyogZ2xvYmFsIGFuZ3VsYXIgKi9cbi8qIGVzbGludCBuby11bmRlZjogXCJlcnJvclwiICovXG4vKlxuICBUT0RPOiBzaG91bGQgcmVsZWFzZSBtaW5pZmllZCAoLm1pbi5qcykgYW5kIG5vdCAoLmpzKVxuKi9cbihmdW5jdGlvbiAoKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBhbmd1bGFyLm1vZHVsZSgnbmdNZXVtb2JpLlV0aWxzJywgW1xuICAgICduZ01ldW1vYmkuVXRpbHMuc2VydmljZXMnLFxuICAgICduZ01ldW1vYmkuVXRpbHMuZmlsdGVycydcbiAgXSk7XG59KSgpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
