/**
 * Node Slide [VERSION]
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */
this.Config = require('../slideshow/Config').Config;

// Port for master server
this.Config.masterport = 8125;

// Time (in milliseconds) for countdown timer
this.Config.timed = 45 * 60 * 1000;

// When to turn on warning color for countdown timer (in milliseconds)
this.Config.timeWarning = 15 * 60 * 1000;
