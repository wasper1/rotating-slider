(function () {
    'use strict';
    var RotatingSlider = function () {
        this.ACCURACY = 0.001;
        this.MIN_STEP_INTERVAL = 40;
        this.MAX_STEP_INTERVAL = 500;
        this.MAX_SPEED_AT_STEPS = 30;
        this.STEPS_LEVEL = {
            NO_ACTION_DISTANCE: 0.01,
            ONE_STEP_DISTANCE: 0.15,
            MIN_SPEED: 0.0015,
            MAX_SPEED: 0.0125
        };
        this.POSITION_CLASSES = [
            'rotating-slider-left-hidden',
            'rotating-slider-left',
            'rotating-slider-center-left',
            'rotating-slider-center',
            'rotating-slider-center-right',
            'rotating-slider-right',
            'rotating-slider-right-hidden'
        ];
        this.STABLE_CLASS = 'rotating-slider-value-stable';
        this.changeCallback = null;
        this.windowEventCallbacks = {
            resize: null,

            touchmove: null,
            touchend: null,

            mousemove: null,
            mouseup: null
        };
        return this;
    };

    RotatingSlider.prototype.isTouchDevice = function () {
        return (('ontouchstart' in window)
            || (navigator.MaxTouchPoints > 0)
            || (navigator.msMaxTouchPoints > 0));
    };

    RotatingSlider.prototype.setChangeCallback = function (f) {
        this.changeCallback = f;
    };

    RotatingSlider.prototype.setValue = function (value) {
        this.selectedValueIndex = this.findValueIndex(this.data, value);
    };

    RotatingSlider.prototype.roundToThree = function (num) {
        return +(Math.round(num + "e+3") + "e-3");
    }

    RotatingSlider.prototype.generateData = function (min, max, step) {
        var ret = [];
        if (step <= 0) {
            ret.push(min);
            return ret;
        }
        var currentValue = min;
        while (max - currentValue > -1 * this.ACCURACY) {
            ret.push(this.roundToThree(currentValue));
            currentValue += step;
        }
        return ret;
    };

    RotatingSlider.prototype.findValueIndex = function (data, value) {
        var minDistI = 0;
        var minDistVal = Number.MAX_VALUE;
        var i = 0;
        for (i = 0; i < data.length; i++) {
            if (Math.abs(data[i] - value) < minDistVal) {
                minDistVal = Math.abs(data[i] - value);
                minDistI = i;
            }
        }
        return minDistI;
    };

    RotatingSlider.prototype.fillLabels = function () {
        var labelsHalfLength = Math.floor(this.POSITION_CLASSES.length / 2);
        var labelsLength = this.POSITION_CLASSES.length;
        var i;
        for (i = 0; i < labelsLength; i++) {
            var index = (this.centerLabelIndex - labelsHalfLength + i) % labelsLength;
            var classValue = this.POSITION_CLASSES[i] + ((this.stableState && i === labelsHalfLength) ? (" " + this.STABLE_CLASS) : "");
            this.DomLabels[index].attr('class', classValue);
            var value = this.data[this.selectedValueIndex + i - labelsHalfLength];
            this.DomLabels[index].text(value !== undefined ? value : "");
        }
    };

    RotatingSlider.prototype.getLabelFromPosition = function (position) {
        var index = (position + this.centerLabelIndex) % this.POSITION_CLASSES.length;
        return this.DomLabels[index];
    };

    RotatingSlider.prototype.setDataModel = function (dataModel, initValue) {
        this.data = this.generateData(dataModel.min, dataModel.max, dataModel.step);
        this.selectedValueIndex = this.findValueIndex(this.data, initValue);
        this.inputField.val(initValue);
    };


    RotatingSlider.prototype.create = function (element, dataModel, initValue) {
        var rotatingSlider = new RotatingSlider();
        rotatingSlider.init(element, dataModel, initValue);
        return rotatingSlider;
    }

    RotatingSlider.prototype.init = function (element, dataModel, initValue) {
        element.append($("<div/>").addClass("rotating-slider-top"));

        this.inputField = $("<input/>");
        this.inputField.attr('type', 'number');
        this.inputField.attr('class', 'rotating-slider-input');
        this.inputField.attr('value', '0');
        this.inputField.on('blur', this.hideInput.bind(this));
        element.append(this.inputField);

        this.container = $("<div/>").addClass("rotating-slider");
        element.append(this.container);
        this.setDataModel(dataModel, initValue);
        var i;
        this.DomLabels = [];
        for (i = 0; i < this.POSITION_CLASSES.length; i++) {
            this.DomLabels.push($("<div/>"));
            this.DomLabels[i].attr('class', this.POSITION_CLASSES[i]);
            this.container.append(this.DomLabels[i]);
        }
        this.hideInput();

        this.centerLabelIndex = Math.floor(this.POSITION_CLASSES.length / 2);
        this.centerLabelIndex++;
        this.centerLabelIndex += 1000 * this.POSITION_CLASSES.length;
        this.setStableState(true);
        this.fillLabels();
        this.forceCentralLabelValue(initValue);

        this.stepsToDo = 0;
        this.moveCounter = 0;
        this.actionData = {
            start: {
                x: undefined,
                y: undefined,
                timeStamp: undefined
            },
            move: {
                allDistance: 0,
                oneDirectionDistance: 0,
                speed: 0,
                x: undefined,
                y: undefined,
                timeStamp: undefined
            },
            stop: {
                x: undefined,
                y: undefined,
                timeStamp: undefined
            }
        };
        setInterval(this.moveLabels.bind(this), this.MIN_STEP_INTERVAL);

        if (this.isTouchDevice()) {
            element.on('touchstart', this.touchSlideStart.bind(this));
        } else {
            element.on('mousedown', this.mouseSlideStart.bind(this));
        }

    };

    RotatingSlider.prototype.moveLabels = function () {
        this.moveCounter++;
        var maxFactor = this.MAX_STEP_INTERVAL / this.MIN_STEP_INTERVAL;
        var normalizer = 1 / (1 - 1 / this.MAX_SPEED_AT_STEPS);
        var factor = 1 / Math.min(Math.abs(this.stepsToDo) + 1, this.MAX_SPEED_AT_STEPS) - 1 / this.MAX_SPEED_AT_STEPS;
        factor = 1 + (factor * normalizer) * (maxFactor - 1);
        factor = Math.round(factor);
        if (this.moveCounter % factor !== 0) {
            return;
        }

        if (this.stepsToDo > 0) {
            if (this.selectedValueIndex > 0) {
                this.stepsToDo--;
                this.centerLabelIndex--;
                ;
                this.selectedValueIndex--;
                this.fillLabels();
            } else {
                this.stepsToDo = 0;
            }
        } else if (this.stepsToDo < 0) {
            if (this.selectedValueIndex < this.data.length - 1) {
                this.stepsToDo++;
                this.centerLabelIndex++;
                ;
                this.selectedValueIndex++;
                this.fillLabels();
            } else {
                this.stepsToDo = 0;
            }
        }
        if (this.stepsToDo === 0) {
            if (!this.stableState) {
                this.setStableState(true);
                this.fillLabels();
                this.inputField.val(this.data[this.selectedValueIndex]);
                if (this.changeCallback !== null) {
                    this.changeCallback(this.data[this.selectedValueIndex]);
                }
            }
        }

    };

    RotatingSlider.prototype.destroy = function () {
        $(window).off('resize', this.windowEventCallbacks.resize);
        $(window).off('touchmove', this.windowEventCallbacks.touchmove);
        $(window).off('touchend', this.windowEventCallbacks.touchend);
        $(window).off('mousemove', this.windowEventCallbacks.mousemove);
        $(window).off('mouseup', this.windowEventCallbacks.mouseup);
    };

    RotatingSlider.prototype.resetDynamicData = function () {
        this.actionData.start.x = undefined;
        this.actionData.start.timeStamp = undefined;
        this.actionData.move.allDistance = 0;
        this.actionData.move.oneDirectionDistance = 0;
        this.actionData.move.speed = 0,
            this.actionData.move.x = undefined;
        this.actionData.move.timeStamp = undefined;
        this.actionData.stop.x = undefined;
        this.actionData.stop.timeStamp = undefined;
        this.actionData.start.y = undefined;
        this.actionData.move.y = undefined;
        this.actionData.stop.y = undefined;
    }

    RotatingSlider.prototype.touchSlideStart = function (evt) {
        if (this.eventBlocker) {
            return;
        }
        evt.preventDefault();
        $(window).off('touchmove', this.windowEventCallbacks.touchmove);
        $(window).off('touchend', this.windowEventCallbacks.touchend);

        this.resetDynamicData();
        this.actionData.start.x = evt.originalEvent.touches[0].pageX;
        this.actionData.start.y = evt.originalEvent.touches[0].pageY;
        this.actionData.start.timeStamp = new Date().getTime();
        this.actionData.move.x = this.actionData.start.x;
        this.actionData.move.y = this.actionData.start.y;
        this.actionData.move.timeStamp = this.actionData.start.timeStamp;

        this.windowEventCallbacks.touchmove = this.touchSlideMove.bind(this);
        $(window).on('touchmove', this.windowEventCallbacks.touchmove);
        this.windowEventCallbacks.touchend = this.touchSlideStop.bind(this);
        $(window).on('touchend', this.windowEventCallbacks.touchend);
    };

    RotatingSlider.prototype.mouseSlideStart = function (evt) {
        if (this.eventBlocker) {
            return;
        }
        $(window).off('mousemove', this.windowEventCallbacks.mousemove);
        $(window).off('mouseup', this.windowEventCallbacks.mouseup);

        this.resetDynamicData();
        this.actionData.start.x = evt.pageX;
        this.actionData.start.y = evt.pageY;
        this.actionData.start.timeStamp = new Date().getTime();
        this.actionData.move.x = this.actionData.start.x;
        this.actionData.move.y = this.actionData.start.y;
        this.actionData.move.timeStamp = this.actionData.start.timeStamp;

        this.windowEventCallbacks.mousemove = this.slideMove.bind(this);
        $(window).on('mousemove', this.windowEventCallbacks.mousemove);
        this.windowEventCallbacks.mouseup = this.mouseSlideStop.bind(this);
        $(window).on('mouseup', this.windowEventCallbacks.mouseup);
    };

    RotatingSlider.prototype.setStableState = function (value) {
        this.stableState = value;
    };

    RotatingSlider.prototype.touchSlideMove = function (evt) {
        evt.preventDefault();
        this.slideMove(evt.originalEvent.touches[0]);
    };
    RotatingSlider.prototype.slideMove = function (evt) {

        var currentMoveX = evt.pageX;
        var currentMoveY = evt.pageY;
        var currentMoveTimestamp = new Date().getTime();
        var currentMoveDistanceDeltaX = currentMoveX - this.actionData.move.x;
        var currentMoveDistanceDeltaY = currentMoveY - this.actionData.move.y;
        var currentMoveTimeDelta = currentMoveTimestamp - this.actionData.move.timeStamp;

        this.actionData.move.allDistance += Math.abs(currentMoveDistanceDeltaX);
        //reset when different signs
        if (this.actionData.move.oneDirectionDistance * (currentMoveDistanceDeltaX) < 0) {
            this.actionData.move.oneDirectionDistance = 0;
        }
        this.actionData.move.oneDirectionDistance += currentMoveDistanceDeltaX;
        if (currentMoveDistanceDeltaX < 0) {
            currentMoveDistanceDeltaX -= Math.abs(currentMoveDistanceDeltaY) * 0.7;
        } else {
            currentMoveDistanceDeltaX += Math.abs(currentMoveDistanceDeltaY) * 0.7;
        }
        this.actionData.move.speed = currentMoveDistanceDeltaX / currentMoveTimeDelta;

        this.actionData.move.x = currentMoveX;
        this.actionData.move.y = currentMoveY;
        this.actionData.move.timeStamp = currentMoveTimestamp;
        this.UpdateStepsToDo();
    };

    RotatingSlider.prototype.touchSlideStop = function (evt) {
        evt.preventDefault();
        this.actionData.stop.x = this.actionData.move.x;
        this.actionData.stop.y = this.actionData.move.y;
        this.actionData.stop.timeStamp = new Date().getTime();

        this.UpdateStepsToDo();

        $(window).off('touchmove', this.windowEventCallbacks.touchmove);
        $(window).off('touchend', this.windowEventCallbacks.touchend);
    };
    RotatingSlider.prototype.mouseSlideStop = function (evt) {
        this.actionData.stop.x = evt.pageX;
        this.actionData.stop.y = evt.pageY;
        this.actionData.stop.timeStamp = new Date().getTime();

        this.UpdateStepsToDo();

        $(window).off('mousemove', this.windowEventCallbacks.mousemove);
        $(window).off('mouseup', this.windowEventCallbacks.mouseup);
    };

    RotatingSlider.prototype.pixelsToPercent = function (pixels) {
        return pixels / this.container.width();
    };

    RotatingSlider.prototype.isOnHold = function () {
        return this.actionData.stop.timeStamp === undefined;
    };

    RotatingSlider.prototype.forceCentralLabelValue = function (val) {
        this.DomLabels[this.centerLabelIndex % this.POSITION_CLASSES.length].text(val);
    };

    RotatingSlider.prototype.getValueFromCentralLabel = function (val) {
        return this.DomLabels[this.centerLabelIndex % this.POSITION_CLASSES.length].text();
    };

    RotatingSlider.prototype.inputFieldContainsValidNumber = function () {
        return !isNaN(parseFloat(this.inputField.val()));
    };

    RotatingSlider.prototype.inputFieldBelowMin = function () {
        return parseFloat(this.inputField.val()) < this.data[0];
    };

    RotatingSlider.prototype.inputFieldAboveMax = function () {
        return parseFloat(this.inputField.val()) > this.data[this.data.length - 1];
    };

    RotatingSlider.prototype.changeCentralLabelValue = function () {
        if (this.inputFieldContainsValidNumber()) {
            var numVal = parseFloat(this.inputField.val());
            if (this.inputFieldBelowMin()) {
                numVal = this.data[0];
            }
            if (this.inputFieldAboveMax()) {
                numVal = this.data[this.data.length - 1];
            }

            var labelsDelta = this.findValueIndex(this.data, numVal) - this.selectedValueIndex;
            this.centerLabelIndex += labelsDelta;
            this.selectedValueIndex += labelsDelta;
            this.fillLabels();
            this.forceCentralLabelValue(numVal);
            if (this.changeCallback !== null) {
                this.changeCallback(numVal);
            }
        }
    };

    RotatingSlider.prototype.showInput = function () {
        this.eventBlocker = true;
        this.container.attr('style', 'visibility:hidden');
        if (!this.inputFieldContainsValidNumber() || this.inputFieldBelowMin() || this.inputFieldAboveMax()) {
            this.inputField.val(this.getValueFromCentralLabel());
        }
        this.inputField.attr('style', '');
        this.inputField.select();
        this.inputField.on("input", this.changeCentralLabelValue.bind(this));
    };

    RotatingSlider.prototype.hideInput = function () {
        this.inputField.off("input");
        this.eventBlocker = false;
        this.inputField.attr('style', 'visibility:hidden');
        this.container.attr('style', '');
    };

    RotatingSlider.prototype.getTapStartingLabelId = function () {
        var containerLeftOffset = this.container.offset().left;
        var eventXRelativeToContainer = this.actionData.start.x - containerLeftOffset;

        var leftLabel = this.getLabelFromPosition(-2);
        var leftCenterLabel = this.getLabelFromPosition(-1);
        var rightCenterLabel = this.getLabelFromPosition(1);
        var rightLabel = this.getLabelFromPosition(2);

        if (eventXRelativeToContainer < leftLabel.offset().left + leftLabel.width() - containerLeftOffset) {
            return -2;
        } else if (eventXRelativeToContainer < leftCenterLabel.offset().left + leftCenterLabel.width() - containerLeftOffset) {
            return -1;
        } else if (eventXRelativeToContainer > rightLabel.offset().left - containerLeftOffset) {
            return 2;
        } else if (eventXRelativeToContainer > rightCenterLabel.offset().left - containerLeftOffset) {
            return 1;
        }
        return 0;
    };

    RotatingSlider.prototype.UpdateStepsToDo = function () {

        var _this = this;

        // move during hold
        if (this.isOnHold()) {
            if (Math.abs(this.pixelsToPercent(this.actionData.move.oneDirectionDistance)) > this.STEPS_LEVEL.ONE_STEP_DISTANCE) {
                this.setStableState(false);
                if (this.actionData.move.oneDirectionDistance < 0) {
                    this.stepsToDo--;
                } else {
                    this.stepsToDo++;
                }
                this.actionData.move.oneDirectionDistance = 0;
            }
            return;
        }

        if (Math.abs(this.pixelsToPercent(this.actionData.move.allDistance)) < this.STEPS_LEVEL.NO_ACTION_DISTANCE) {
            // stop moving slider on tap
            if (!this.stableState) {
                this.stepsToDo = 0;
            } else {
                switch (this.getTapStartingLabelId()) {
                    case 2:
                        this.setStableState(false);
                        this.stepsToDo -= 2;
                        break;
                    case 1:
                        this.setStableState(false);
                        this.stepsToDo -= 1;
                        break;
                    case 0:
                        this.showInput();
                        break;
                    case -1:
                        this.setStableState(false);
                        this.stepsToDo += 1;
                        break;
                    case -2:
                        this.setStableState(false);
                        this.stepsToDo += 2;
                        break;
                }
            }
            return;
        }

        if (Math.abs(this.pixelsToPercent(this.actionData.move.speed)) > this.STEPS_LEVEL.MIN_SPEED) {
            this.setStableState(false);
            var factor = (Math.min(Math.abs(this.pixelsToPercent(this.actionData.move.speed)), this.STEPS_LEVEL.MAX_SPEED) - this.STEPS_LEVEL.MIN_SPEED) / (this.STEPS_LEVEL.MAX_SPEED - this.STEPS_LEVEL.MIN_SPEED);
            var steps = Math.round(10 + factor * 29);
            if (this.actionData.move.speed < 0) {
                this.stepsToDo -= steps;
            } else {
                this.stepsToDo += steps;
            }
        }
    };

    if (!window.RotatingSlider) {
        window.RotatingSlider = RotatingSlider.prototype.create;
    }
    ;

})();