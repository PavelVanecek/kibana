import $ from 'jquery';
import _ from 'lodash';
import RegistrySpyModesProvider from 'ui/registry/spy_modes';
import uiModules from 'ui/modules';
import spyTemplate from 'ui/visualize/spy.html';
uiModules
  .get('app/visualize')
  .directive('visualizeSpy', function (Private, $compile) {

    var spyModes = Private(RegistrySpyModesProvider);
    var defaultMode = spyModes.inOrder[0].name;

    return {
      restrict: 'E',
      template: spyTemplate,
      link: function ($scope, $el) {
        var currentSpy;
        var $container = $el.find('.visualize-spy-container');
        var fullPageSpy = _.get($scope.spy, 'mode.fill', false);
        $scope.modes = spyModes;
        $scope.spy.params = $scope.spy.params || {};

        function getSpyObject(name) {
          name = _.isUndefined(name) ? $scope.spy.mode.name : name;
          fullPageSpy = (_.isNull(name)) ? false : fullPageSpy;

          return {
            name: name,
            fill: fullPageSpy,
          };
        }

        var renderSpy = function (spyName) {
          var newMode = $scope.modes.byName[spyName];

          // clear the current value
          if (currentSpy) {
            currentSpy.$container && currentSpy.$container.remove();
            currentSpy.$scope && currentSpy.$scope.$destroy();
            $scope.spy.mode = {};
            currentSpy = null;
          }

          // no further changes
          if (!newMode) return;

          // update the spy mode and append to the container
          $scope.spy.mode = getSpyObject(newMode.name);

          currentSpy = _.assign({
            $scope: $scope.$new(),
            $container: $('<div class="visualize-spy-content">').appendTo($container)
          }, $scope.spy.mode);

          currentSpy.$container.append($compile(newMode.template)(currentSpy.$scope));
          newMode.link && newMode.link(currentSpy.$scope, currentSpy.$container);
        };

        $scope.toggleDisplay = function () {
          var modeName = _.get($scope.spy, 'mode.name');
          $scope.setSpyMode(modeName ? null : defaultMode);
        };

        $scope.toggleFullPage = function () {
          fullPageSpy = !fullPageSpy;
          $scope.spy.mode = getSpyObject();
        };

        $scope.setSpyMode = function (modeName) {
          // save the spy mode to the UI state
          if (!_.isString(modeName)) modeName = null;
          $scope.spy.mode = getSpyObject(modeName);
        };

        if ($scope.uiState) {
          // sync external uiState changes
          var syncUIState = () => $scope.spy.mode = $scope.uiState.get('spy.mode');
          $scope.uiState.on('change', syncUIState);
          $scope.$on('$destroy', () => $scope.uiState.off('change', syncUIState));
        }

        // re-render the spy when the name of fill modes change
        $scope.$watchMulti([
          'spy.mode.name',
          'spy.mode.fill'
        ], function (newVals, oldVals) {
          // update the ui state, but only if it really changes
          var changedVals = newVals.filter((val) => !_.isUndefined(val)).length > 0;
          if (changedVals && !_.isEqual(newVals, oldVals)) {
            if ($scope.uiState) $scope.uiState.set('spy.mode', $scope.spy.mode);
          }

          // ensure the fill mode is synced
          fullPageSpy = _.get($scope.spy, 'mode.fill', fullPageSpy);

          renderSpy(_.get($scope.spy, 'mode.name', null));
        });
      }
    };
  });
