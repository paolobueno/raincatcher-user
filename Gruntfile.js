'use strict';

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      src: ["lib/**/*.js"]
    },
    shell: {
      unit: {
        options: {
          stdout: true,
          stderr: true
        },
        command: 'env NODE_PATH=. ./node_modules/.bin/mocha -A -u exports --recursive **/*-spec.js'
      }
    }
  });

  grunt.loadNpmTasks("grunt-eslint");
  grunt.registerTask('default', ['eslint']);
  grunt.registerTask('unit', ['eslint','shell:unit']);
};