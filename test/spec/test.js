/* global describe, it, expect, layOutDay, calendar */

(function() {
    'use strict';

    describe('layOutDay', function() {
        it('should accept an array without freaking out', function() {
            function addEvents() {
                layOutDay([{
                    start: 0,
                    end: 50
                }, {
                    start: 0,
                    end: 70
                }]);
            }
            expect(addEvents).to.not.throw({
                message: 'Expected array'
            });
        });
        it('should throw an exception when passed something that\'s not an array', function() {
            function addEvents() {
                layOutDay(5);
            }
            expect(addEvents).to.throw({
                message: 'Expected array'
            });
        });
    });

    describe('calendar.addEvents', function() {

        it('should accept list of event objects, add it to calendar._events', function() {
            calendar.addEvents([{
                start: 0,
                end: 50
            }, {
                start: 0,
                end: 30
            }]);
            expect(calendar._events.length).to.equal(4);
        });
        
    });
    describe('calendar.removeEvents', function() {
        it('should empty calendar._events, when passed no args', function() {
            calendar.removeEvents();
            expect(calendar._events.length).to.equal(0);
        });
    });

    describe('calendar._hasCollision', function () {
        it('should detect collisions between events correctly', function () {
            expect(calendar._hasCollision({start: 0, end: 50}, {start: 60, end: 70})).to.be.false;
            expect(calendar._hasCollision({start: 60, end: 70}, {start: 0, end: 50})).to.be.false;
            expect(calendar._hasCollision({start: 0, end: 50}, {start: 40, end: 70})).to.be.true;
            expect(calendar._hasCollision({start: 40, end: 70}, {start: 0, end: 50})).to.be.true;
        });
    });
})();
