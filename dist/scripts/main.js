/* global layOutDay, calendar, _ */

jQuery(document).ready(function($) {
    'use strict';

    //exception to throw
    var ArrayExpected = {
        message: 'Expected array'
    };
    
    var CALENDAR_WIDTH = 600;
    //need to add this to the left of every calendar event
    var CALENDAR_LEFT_PAD = 10;

    //export layoutDay to the global namespace
    window.layOutDay = function(events) {
        if (!(events instanceof Array)) {
            throw ArrayExpected;
        }

        //remove all current events. begin with
        //a clean slate
        calendar.removeEvents();

        //add events to the list of today's events
        calendar.addEvents(events);
    };

    //namespace to hide everything under
    window.calendar = {};

    //array containing the day's events
    calendar._events = [];

    //add single event or list of events
    calendar.addEvents = function(events) {

        function sortEventsAsc(evt1, evt2) {
            return evt1.start - evt2.start;
        }

        //basic input validation
        if (!(events instanceof Array)) {
            throw ArrayExpected;
        }

        //sort events by start time
        events.sort(sortEventsAsc);

        //then add to internal list of events
        calendar._events = calendar._events.concat(events);

        //start a re-render
        //because event/event-listener pattern to
        //call render is too much work
        calendar.render();
    };

    //empties the entire array of events
    //don't need an event ID for now
    calendar.removeEvents = function() {
        calendar._events = [];
    };


    //events collide if one's start or end lies between the other's start and end
    calendar._hasCollision = function(event1, event2) {
        return (event1.start >= event2.start && event1.start <= event2.end) ||
               (event2.start >= event1.start && event2.start <= event1.end) ||
               (event1.end >= event2.start && event1.end <= event2.end) ||
               (event2.end >= event1.start && event2.end <= event1.end);
    };


    //returns the number of events in eventList that
    //collide with evt
    calendar._findCollisions = function(evt, eventList) {

        evt.collisions = [];
        var collisions = evt.collisions;

        //first find all the collisions
        for (var i = eventList.length - 1; i >= 0; i--) {
            //we know evt wil collide with itself, so don't check that
            if ((evt !== eventList[i]) && calendar._hasCollision(evt, eventList[i])) {
                //store whatever collisions there are in this list
                collisions.push(i);
            }
        }

        //next, find out which of the collisions collide with each other
        //if two collisions don't collide with each other, then the later
        //should be removed from the list

        //why?? - because collisions.length will be used to calculate an
        //event's width in the next step, and the earlier collisions will
        //determine the correct width for the event. by the time a later
        //collision is rendered, this event will already have been rendered

        //important to check against collisions.length every pass
        //of the for loop since we're modifying the array
        for (i = 0; i < collisions.length; i++) {
            for (var j = 0; j < collisions.length; j++) {
                //don't compare event with itself
                if (j !== i && !calendar._hasCollision(eventList[collisions[i]], eventList[collisions[j]])) {
                    collisions.splice(i, 1);
                }
            }
        }
    };

    //pass in an eventList with known collisions and calculate the
    //effective width for each event based on the widths of the events
    //that it collides with
    calendar._calculateEventWidths = function(eventList) {
        for (var i = 0, len = eventList.length; i < len; i++) {
            var evt = eventList[i],
                collisions = evt.collisions;

            if (collisions.length > 0) {

                //see what widths the colliding events have
                //if all its collisions have already-calculated widths,
                //own width is CALENDAR_WIDTH - sum of other collisions
                //else just divide CALENDAR_WIDTH by length of collisions
                var sumCollisionWidths = 0;
                for (var j = 0, colLen = collisions.length; j < colLen; j++) {
                    //found a collision without a calculated width,
                    //so just set own width to CALENDAR_WIDTH / collisions
                    if (!eventList[collisions[j]].eventWidth) {
                        evt.eventWidth = CALENDAR_WIDTH / (collisions.length + 1);
                        break;
                    } else {
                        //add up other collisions' widths
                        sumCollisionWidths += eventList[collisions[j]].eventWidth;
                    }
                }
                //only way to know if the for loop above ever
                //hit the first if condition
                if (!evt.eventWidth) {
                    //if all collisions had widths already calculated
                    //my width is CALENDAR_WIDTH - sumCollisionWidths
                    evt.eventWidth = CALENDAR_WIDTH - sumCollisionWidths;
                }
            }
            else {
                evt.eventWidth = CALENDAR_WIDTH;
            }
        }
    };


    //calendar events are absolutely positioned in the container
    //the top is always the start time, but the left is more
    //complicated, because of colliding events
    calendar._calculateEventLefts = function(eventList) {
        function integerComparatorAsc (int1, int2) {
            return int1 - int2;
        }

        for (var i = 0, len = eventList.length; i < len; i++) {
            var evt = eventList[i];
            //every event wants to be at the leftmost position if possible
            if(evt.collisions.length === 0) {
                //so if an event has no collisions, it has left = CALENDAR_LEFT_PAD
                evt.left = CALENDAR_LEFT_PAD;
            } else {

                var evtCollisions = evt.collisions;

                //sort all the collisions by index (and therefore, start time)
                evtCollisions.sort(integerComparatorAsc);

                //likewise, if an event has collisions, but the event starts
                //before any of its collisions, it too gets the leftmost position
                if (i < evtCollisions[0]) {
                    evt.left = CALENDAR_LEFT_PAD;
                }
                else {
                    //otherwise, the leftPos is one of n values, where n == collisions.length


                    //so go through the collision list and find the first left
                    //value that hasn't been assigned to any of the collisions, and use it

                        //check if leftPos has been assigned to a collision yet
                    var leftPos = CALENDAR_LEFT_PAD,

                        colLen = evtCollisions.length;

                    for (var j = 0; j <= colLen; j++) {
                        //we've checked all the collisions and found all their
                        //leftPos-es taken, so take the last one

                        if(j === colLen) {
                            evt.left = leftPos;
                            break;
                        }

                        var collision = eventList[evtCollisions[j]];
                        if(collision.left === leftPos) {
                            //this leftPos has already been assigned to a collision
                            //so get the next possible leftPos by adding the
                            //collision's width
                            leftPos += collision.eventWidth;
                            continue;
                        } else {
                            //found a left position that isn't occupied, so take it
                            //and break from searching
                            evt.left = leftPos;
                            break;
                        }
                        
                    }
                }
            }
        }
    };

    //draws the contents of _events on to the screen
    calendar.render = function() {

        //shortcut
        var events = calendar._events;

        //compiled event view template
        var eventTpl = _($('#eventTpl').html()).template();

        var $calContainer = $('#calendar-container');

        //clear away any old events
        $calContainer.empty();

        for (var i = 0; i < events.length; i++) {
            var evt = events[i];

            //calculate the event's height based on length of event
            //total height of calendar is 720px so 1 px/minute
            evt.eventHeight = evt.end - evt.start;

            //finds all the events that collide with evt
            //and stores their indexes in an array as a
            //property of evt
            calendar._findCollisions(evt, events);

            //fake name and location
            evt.eventTitle = evt.eventTitle || 'Product meeting';
            evt.eventLocation = evt.eventLocation || 'Galactica';
            
        }

        //calculate width of each event taking into account its collisions
        calendar._calculateEventWidths(events);

        //calculate the left position of each event taking into account its collisions
        calendar._calculateEventLefts(events);

        for (i = 0; i < events.length; i++) {
            //pass each event object through the templating function
            var evtString = eventTpl(events[i]);

            //and add it to the page
            $calContainer.append(evtString);
        }
        
    };
});
