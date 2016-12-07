var ngModule;
try {
  ngModule = angular.module('wfm.user.directives');
} catch (e) {
  ngModule = angular.module('wfm.user.directives', []);
}

ngModule.run(['$templateCache', function ($templateCache) {
  $templateCache.put('wfm-template/worker-form.tpl.html',
    '<md-toolbar class="content-toolbar">\n' +
    '  <div class="md-toolbar-tools">\n' +
    '    <h3>\n' +
    '      Worker : {{ctrl.model.name}}\n' +
    '    </h3>\n' +
    '\n' +
    '    <span flex></span>\n' +
    '    <md-button class="md-icon-button" aria-label="Close" ng-click="ctrl.selectWorker($event, ctrl.model)">\n' +
    '      <md-icon md-font-set="material-icons">close</md-icon>\n' +
    '    </md-button>\n' +
    '  </div>\n' +
    '</md-toolbar>\n' +
    '<md-button class="md-fab" aria-label="New Workorder" ui-sref="app.worker.new">\n' +
    '  <md-icon md-font-set="material-icons">add</md-icon>\n' +
    '</md-button>\n' +
    '\n' +
    '<div class="wfm-maincol-scroll">\n' +
    '\n' +
    '<form name="workerForm" ng-submit="ctrl.done(workerForm.$valid)" novalidate layout-padding layout-margin>\n' +
    '\n' +
    '  <md-input-container class="md-block">\n' +
    '    <label for="workername">Worker Name</label>\n' +
    '    <input type="text" id="workername" name="workername" ng-model="ctrl.model.name" required>\n' +
    '    <div ng-messages="workerForm.workername.$error" ng-if="ctrl.submitted || workerForm.workername.$dirty">\n' +
    '      <div ng-message="required">A name is required.</div>\n' +
    '    </div>\n' +
    '  </md-input-container>\n' +
    '\n' +
    '  <md-input-container class="md-block">\n' +
    '    <label for="workername">Username</label>\n' +
    '    <input type="text" id="username" name="username" ng-model="ctrl.model.username" required>\n' +
    '    <div ng-messages="workerForm.username.$error" ng-if="ctrl.submitted || workerForm.username.$dirty">\n' +
    '      <div ng-message="required">A username is required.</div>\n' +
    '    </div>\n' +
    '  </md-input-container>\n' +
    '\n' +
    '  <md-input-container class="md-block">\n' +
    '    <label for="workername">Password</label>\n' +
    '    <input type="password" id="password" name="password" ng-model="ctrl.model.password" required>\n' +
    '    <div ng-messages="workerForm.password.$error" ng-if="ctrl.submitted || workerForm.password.$dirty">\n' +
    '      <div ng-message="required">A password is required.</div>\n' +
    '    </div>\n' +
    '  </md-input-container>\n' +
    '\n' +
    '  <md-input-container class="md-block">\n' +
    '    <label for="workername">Banner URL</label>\n' +
    '    <input type="url" id="banner" name="banner" ng-model="ctrl.model.banner">\n' +
    '    <div ng-messages="workerForm.banner.$error" ng-if="ctrl.submitted || workerForm.banner.$dirty">\n' +
    '      <div ng-message="url">Invalid URL.</div>\n' +
    '    </div>\n' +
    '\n' +
    '  </md-input-container>\n' +
    '\n' +
    '  <md-input-container class="md-block">\n' +
    '    <label for="workername">Avatar URL</label>\n' +
    '    <input type="url" id="avatar" name="avatar" ng-model="ctrl.model.avatar">\n' +
    '    <div ng-messages="workerForm.avatar.$error" ng-if="ctrl.submitted || workerForm.avatar.$dirty">\n' +
    '       <div ng-message="url">Invalid URL.</div>\n' +
    '    </div>\n' +
    '  </md-input-container>\n' +
    '\n' +
    '  <md-input-container class="md-block">\n' +
    '    <label for="workername">Phone number</label>\n' +
    '    <input type="number" id="phonenumber" name="phonenumber" ng-model="ctrl.model.phone" pattern="([0-9]{7,15})" required>\n' +
    '    <div ng-messages="workerForm.phonenumber.$error" ng-if="ctrl.submitted || workerForm.phonenumber.$dirty">\n' +
    '      <div ng-message="required">A phone number is required.</div>\n' +
    '      <div ng-message="pattern">A phone number can\'t be less than 7 or more than 15 digits.</div>\n' +
    '    </div>\n' +
    '  </md-input-container>\n' +
    '\n' +
    '  <md-input-container class="md-block">\n' +
    '    <label for="workername">Email</label>\n' +
    '    <input type="email" id="email" name="email" ng-model="ctrl.model.email" required>\n' +
    '    <div ng-messages="workerForm.email.$error" ng-if="ctrl.submitted || workerForm.email.$dirty">\n' +
    '      <div ng-message="required">An email is required.</div>\n' +
    '      <div ng-message="email">Invalid email.</div>\n' +
    '    </div>\n' +
    '  </md-input-container>\n' +
    '\n' +
    '  <md-input-container class="md-block">\n' +
    '    <label for="workername">Position</label>\n' +
    '    <input type="text" id="position" name="position" ng-model="ctrl.model.position" required>\n' +
    '    <div ng-messages="workerForm.position.$error" ng-if="ctrl.submitted || workerForm.position.$dirty">\n' +
    '      <div ng-message="required">An position is required.</div>\n' +
    '    </div>\n' +
    '  </md-input-container>\n' +
    '\n' +
    '  <md-input-container class="md-block">\n' +
    '    <label for="assignee">Group</label>\n' +
    '    <md-select ng-model="ctrl.model.group" name="group" id="group" required>\n' +
    '       <md-option ng-repeat="group in ctrl.groups" value="{{group.id}}">{{group.name}}</md-option>\n' +
    '     </md-select>\n' +
    '     <div ng-messages="workerForm.group.$error" ng-if="ctrl.submitted || workerForm.group.$dirty">\n' +
    '       <div ng-message="required">An group is required.</div>\n' +
    '     </div>\n' +
    '  </md-input-container>\n' +
    '\n' +
    '  <md-button type="submit" class="md-raised md-primary">{{ctrl.model.id || ctrl.model.id === 0 ? \'Update\' : \'Create\'}} Worker</md-button>\n' +
    '</form>\n' +
    '</div>\n' +
    '');
}]);
