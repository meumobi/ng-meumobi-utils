(function () {
  'use strict';

  angular
    .module('ngMeumobi.Cordova.files', ['slugifier'])
    .constant('MIMES', {
      'application/pdf': {
        class: 'fa-file-pdf-o',
        label: 'View',
        extension: 'pdf',
        download: true,
      },
      'text/html': {
        class: 'fa-rss',
        label: 'Open',
        extension: 'html',
        download: false,
      },
      'application/vnd.youtube.video+html': {
        class: 'fa-youtube-play',
        openClass: 'fa-play',
        label: 'Play',
        extension: 'html',
        download: false,
      },
      'application/vnd.ms-excel': {
        class: 'fa-file-excel-o',
        label: 'View',
        extension: 'xls',
        download: true,
      },
      'application/xlsx': {
        class: 'fa-file-excel-o',
        label: 'View',
        extension: 'xls',
        download: true,
      },
      'audio/mpeg': {
        class: 'fa-file-audio-o',
        label: 'Play',
        openClass: 'fa-play',
        extension: 'mp3',
        download: true,
      },
      'video/mp4': {
        class: 'fa-file-video-o',
        label: 'Play',
        openClass: 'fa-play',
        extension: 'mp4',
        download: true,
      },
      'application/vnd.ms-powerpoint': {
        class: 'fa-file-powerpoint-o',
        label: 'View',
        extension: 'ppt',
        download: true,
      },
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        class: 'fa-file-excel-o',
        label: 'View',
        extension: 'xls',
        download: true,
      },
    })
    .filter('mediaClickLabel', mediaClickLabel)
    .filter('mediaIconClass', mediaIconClass)
    .filter('mediaOpenClass', mediaOpenClass)
    .provider('meuFiles', files);

  function files() {
    var fileTransfers = {};
    var files = {};
    var options = {
      localFolder: 'Downloads',
    };
    var statuses = {
      download: 'download',
      downloading: 'downloading',
      downloaded: 'downloaded',
    };

    this.setOptions = function (options) {
      angular.extend(options, opt);
    };

    this.setOption = function (name, value) {
      options[name] = value;
    };

    this.$get = function ($q, $log, $window, MIMES, Slug) {
      var api = {};
      var service = {};

      /**
       *  Api methods, available only on the inside the service
       */

      api.fileErrorHandler = function (e) {
        /*
        List of Errors cordova-plugin-file
        https://github.com/apache/cordova-plugin-file#list-of-error-codes-and-meanings
        For the meaning I recommend to read https://wicg.github.io/entries-api/#common-types
        */
        switch (e.code) {
          case FileError.NOT_FOUND_ERR:
            e.message = 'Requested file could not be found';
            break;
          case FileError.SECURITY_ERR:
            e.message = 'SECURITY_ERR';
            break;
          case FileError.ABORT_ERR:
            e.message = 'ABORT_ERR';
            break;
          case FileError.NOT_READABLE_ERR:
            e.message = 'NOT_READABLE_ERR';
            break;
          case FileError.ENCODING_ERR:
            e.message = 'Malformed URI';
            break;
          case FileError.NO_MODIFICATION_ALLOWED_ERR:
            e.message = 'NO_MODIFICATION_ALLOWED_ERR';
            break;
          case FileError.INVALID_STATE_ERR:
            e.message = 'INVALID_STATE_ERR';
            break;
          case FileError.SYNTAX_ERR:
            e.message = 'SYNTAX_ERR';
            break;
          case FileError.INVALID_MODIFICATION_ERR:
            e.message = 'INVALID_MODIFICATION_ERR';
            break;
          case FileError.QUOTA_EXCEEDED_ERR:
            e.message = 'QUOTA_EXCEEDED_ERR';
            break;
          case FileError.TYPE_MISMATCH_ERR:
            e.message = 'TYPE_MISMATCH_ERR';
            break;
          case FileError.PATH_EXISTS_ERR:
            e.message = 'PATH_EXISTS_ERR';
            break;
          default:
            e.message = 'Unknown Error';
            break;
        }
        $log.debug('Error: ' + e.message);

        return e;
      };

      api.fileTransferErrorHandler = function (e) {
        /*
        A FileTransferError object is passed to an error callback when an error occurs.
        https://github.com/apache/cordova-plugin-file-transfer#filetransfererror
        */
        switch (e.code) {
          case FileTransferError.FILE_NOT_FOUND_ERR:
            e.message = 'FILE_NOT_FOUND_ERR';
            break;
          case FileTransferError.INVALID_URL_ERR:
            e.message = 'INVALID_URL_ERR';
            break;
          case FileTransferError.CONNECTION_ERR:
            e.message = 'CONNECTION_ERR';
            break;
          case FileTransferError.ABORT_ERR:
            e.message = 'Operation aborted';
            break;
          case FileTransferError.NOT_MODIFIED_ERR:
            e.message = 'NOT_MODIFIED_ERR';
            break;
          default:
            e.message = 'Unknown Error';
            break;
        }
        $log.debug('Error: ' + e.message);

        return e;
      };

      api.getFilesFromLocalStorage = function () {
        /*
        Check if files is already loaded (if not is empty)
        TODO: is loading localStorage['files] for each media, should be optimized to only load once for all
        */
        if (!Object.keys(files).length && localStorage['files']) {
          var entries = angular.fromJson(localStorage['files']);
          files = api.checkRepositoryConsistency(entries);
        }
        return files;
      };

      api.getFileName = function (file) {
        var ext = file.extension || '';

        if (!ext && MIMES[file.type]) ext = MIMES[file.type].extension;

        var name = file.title || '';

        if (!name) {
          name = md5(file.url);
        } else {
          name = Slug.slugify(name);
        }

        return name + '.' + ext;
      };

      api.checkRepositoryConsistency = function (entries) {
        /*
      id must be equals to file.path
      and fullPath can be updated if App is updated (iOS)
      */
        var obj = {};
        // forEach wait till the promise is over to go to the next.
        Object.keys(entries).forEach(function (key, index) {
          api.getFileFullPath(entries[key].name).then((fileFullPath) => {
            obj[entries[key].path] = entries[key];
            obj[entries[key].path].fullPath = fileFullPath;
          });
        });
        localStorage['files'] = angular.toJson(obj);

        return obj;
      };

      api.getDownloadDirEntry = function (rootPath, dirName) {
        var q = $q.defer();
        $window.resolveLocalFileSystemURL(
          rootPath,
          function (rootEntry) {
            // Parameters passed to getDirectory create a new directory or return the directory if it already exists.
            rootEntry.getDirectory(
              dirName,
              { create: true, exclusive: false },
              function (dirEntry) {
                q.resolve(dirEntry);
              },
              function (error) {
                $log.debug(error);
                error = api.fileErrorHandler(error);
                q.reject(error);
              }
            );
          },
          function (error) {
            $log.debug(error);
            error = api.fileErrorHandler(error);
            q.reject(error);
          }
        );
        return q.promise;
      };

      // Returns the full absolute path from the root to the FileEntry
      api.getFileFullPath = function (fileName) {
        var rootPath = null;
        if (device.platform == 'Android') {
          rootPath = cordova.file.externalDataDirectory;
        } else {
          rootPath = cordova.file.dataDirectory;
        }
        return api.getDownloadDirEntry(rootPath, options.localFolder).then((dirEntry) => dirEntry.nativeURL + fileName);
      };

      api.getFilePath = function (fileName) {
        return options.localFolder + '/' + fileName;
      };

      //add file to localstorage
      api.addFile = function (file) {
        files[file.path] = file;
        localStorage['files'] = angular.toJson(files);
      };

      //remove file from localstorage
      api.removeFile = function (id) {
        delete files[id];
        localStorage['files'] = angular.toJson(files);
      };

      //get files handler
      api.getFileEntry = function (path) {
        var q = $q.defer();
        $window.resolveLocalFileSystemURL(
          path,
          function (entry) {
            q.resolve(entry);
          },
          function (error) {
            $log.debug(error);
            error = api.fileErrorHandler(error);
            q.reject(error);
          }
        );
        return q.promise;
      };

      api.isDownloaded = function (filePath) {
        /*
        TODO: If status is downloaded but local file is missing then return FALSE
        Keep record on localstorage to appears as file already downloaded, user can re-download if needed
        */
        return !!api.getFilesFromLocalStorage()[filePath];
      };

      api.isDownloading = function (filePath) {
        return !!fileTransfers[filePath];
      };

      api.getFileStatus = function (filePath) {
        if (api.isDownloaded(filePath)) {
          return statuses.downloaded;
        } else if (api.isDownloading(filePath)) {
          return statuses.downloading;
        } else {
          return statuses.download;
        }
      };

      /**
       * Service methods, that are public and available for any resource
       */
      // File available statuses, best for debug and maitain than just string.

      service.download = download;
      service.decorateFile = decorateFile;
      service.remove = remove;
      service.list = api.getFilesFromLocalStorage;
      service.open = open;
      service.isDownloadable = isDownloadable;
      service.openFileOpener = openFileOpener;

      return service;

      /*
      Install: cordova plugin add cordova-plugin-file-opener2
      https://www.npmjs.com/package/cordova-plugin-file-opener2
      */

      function isDownloadable(file) {
        return file.type in MIMES ? MIMES[file.type].download : true;
      }

      function openFileOpener(uri, type) {
        var q = $q.defer();

        cordova.plugins.fileOpener2.open(uri, type, {
          error: function (e) {
            q.reject(e);
          },
          success: function () {
            q.resolve();
          },
        });
        return q.promise;
      }

      function open(file) {
        var q = $q.defer();
        var cb_entry = {
          success: function (entry) {
            openFileOpener(entry.nativeURL, file.type).then(
              function () {
                q.resolve();
              },
              function (e) {
                q.reject(e);
              }
            );
          },
          fail: function (e) {
            q.reject(e);
          },
        };

        return api.getFileFullPath(file.name).then((fileFullPath) => {
          file.fullPath = fileFullPath;
          api.getFileEntry(file.fullPath).then(
            function (entry) {
              cb_entry.success(entry);
            },
            function (e) {
              cb_entry.fail(e);
            }
          );
          return q.promise;
        });
      }

      function download(file) {
        var q = $q.defer();
        var ft = new FileTransfer();
        var uri = encodeURI(file.url);

        file.status = statuses.downloading;
        fileTransfers[file.path] = ft;

        ft.onprogress = function (progress) {
          q.notify(progress);
        };

        q.promise.abort = function () {
          ft.abort();
        };

        var cb_download = {
          success: function (fileEntry) {
            file.status = statuses.downloaded;
            api.addFile(file);
            delete fileTransfers[file.path];
            q.resolve(file);
          },
          fail: function (error) {
            $log.debug(error);
            file.status = statuses.download;
            error = api.fileTransferErrorHandler(error);
            delete fileTransfers[file.path];
            q.reject(error);
          },
        };
        return api.getFileFullPath(file.name).then((fileFullPath) => {
          file.fullPath = fileFullPath;
          ft.download(uri, file.fullPath, cb_download.success, cb_download.fail, false);

          return q.promise;
        });
      }

      function remove(file) {
        var q = $q.defer();

        file.fullPath = api.getFileFullPath(file.name);
        api.getFileEntry(file.fullPath).then(
          function (entry) {
            entry.remove(
              function (status) {
                api.removeFile(file.path);
                file.status = statuses.download;
                q.resolve(file);
              },
              function (error) {
                q.reject(error);
              }
            );
          },
          function (error) {
            file.status = statuses.download;
            q.reject(error);
          }
        );

        return q.promise;
      }

      function decorateFile(file) {
        file.name = file.name || api.getFileName(file);
        file.path = file.path || api.getFilePath(file.name);
        file.status = api.getFileStatus(file.path);

        /*
    If device not exists then app run on browser
    */
        if (!typeof device) {
          var fullPath = api.getFileFullPath(file.name);
          if (api.isDownloaded(fullPath)) file.fullPath = fullPath;
        }

        return file;
      }
    };
  }

  function mediaClickLabel(MIMES) {
    return function (type) {
      return MIMES[type] ? MIMES[type].label : 'Open';
    };
  }

  function mediaIconClass(MIMES) {
    return function (type) {
      return MIMES[type] ? MIMES[type].class : 'fa-external-link';
    };
  }

  function mediaOpenClass(MIMES) {
    return function (type) {
      return MIMES[type] && MIMES[type].openClass ? MIMES[type].openClass : 'fa-eye';
    };
  }
})();
