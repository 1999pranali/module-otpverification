/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

define([
    'jquery',
    'loader'
], function ($, loader) {
    'use strict';

    return {
        containerId: '#otpLoader',
        loaderObj: {},

        /**
         * Initialize loader on contianer
         */
        initialize: function () {
            $(this.containerId).loader(loaderObj);
        },

        /**
         * Set loader icon url
         * @param {String} icon 
         */
        setIcon: function(icon) {
            if (icon) {
                this.loaderObj.icon = icon;
            }

            return this;
        },

        /**
         * Set Loader text
         * @param {String} text 
         */
        setText: function(text) {
            if (text) {
                this.loaderObj.texts.loaderText = text;
            }

            return this;
        },

        /**
         * Set Loader image alt text
         * @param {String} imgAlt 
         */
        setImgAlt: function (imgAlt) {
            if (imgAlt) {
                this.loaderObj.texts.imgAlt = imgAlt;
            }

            return this;
        },

        /**
         * Set loader container Id
         * @param {String} containerId 
         */
        setContainerId: function (containerId) {
            if (containerId) {
                this.containerId = containerId; 
            }

            return this;
        },

        /**
         * Start full page loader action
         */
        startLoader: function () {
            $(this.containerId).trigger('processStart');
        },

        /**
         * Stop full page loader action
         */
        stopLoader: function () {
            var $elem = $(this.containerId),
                stop = $elem.trigger.bind($elem, 'processStop');
            stop();
        }
    };
});
