(function() {

    // Shortcuts for event listeners
    var on = addEventListener,
        off = removeEventListener,
    
    // Query selector shortcuts
        $ = function(q) { return document.querySelector(q) },
        $$ = function(q) { return document.querySelectorAll(q) },
    
    // DOM references
        $body = document.body,
        $inner = $('.inner');
    
    // Client detection object
        client = (function() {
        var o = {
            browser: 'other',         // Default browser type
            browserVersion: 0,        // Default browser version
            os: 'other',              // Default OS type
            osVersion: 0,             // Default OS version
            mobile: false,            // Mobile flag
            canUse: null,             // Feature detection (not set yet)
            flags: { lsdUnits: false, }, // Additional flags
        },
    
        ua = navigator.userAgent, // User-Agent string
            a, i;
    
        // Browser detection
        a = [
            ['firefox', /Firefox\/([0-9\.]+)/],
            ['edge', /Edge\/([0-9\.]+)/],
            ['safari', /Version\/([0-9\.]+).+Safari/],
            ['chrome', /Chrome\/([0-9\.]+)/],
            ['chrome', /CriOS\/([0-9\.]+)/],  // Chrome on iOS
            ['ie', /Trident\/.+rv:([0-9]+)/] // Internet Explorer
        ];
    
        // Loop through browser regex patterns
        for (i = 0; i < a.length; i++) {
            if (ua.match(a[i][1])) {
                o.browser = a[i][0];                // Set detected browser
                o.browserVersion = parseFloat(RegExp.$1); // Set version number
                break;
            }
        }
    
        // OS detection
        a = [
            ['ios', /([0-9_]+) like Mac OS X/, function(v) { return v.replace('_', '.').replace('_', ''); }],
            ['ios', /CPU like Mac OS X/, function(v) { return 0 }],
            ['ios', /iPad; CPU/, function(v) { return 0 }],
            ['android', /Android ([0-9\.]+)/, null],
            ['mac', /Macintosh.+Mac OS X ([0-9_]+)/, function(v) { return v.replace('_', '.').replace('_', ''); }],
            ['windows', /Windows NT ([0-9\.]+)/, null],
            ['undefined', /Undefined/, null]
        ];
    
        // Loop through OS regex patterns
        for (i = 0; i < a.length; i++) {
            if (ua.match(a[i][1])) {
                o.os = a[i][0];  // Set detected OS
                o.osVersion = parseFloat(
                    a[i][2] ? (a[i][2])(RegExp.$1) : RegExp.$1
                ); // Convert version format if needed
                break;
            }
        }
            // If the device is a Mac with touch support and specific screen dimensions,
            // reclassify it as 'ios' (this handles certain iPad detections in Safari).
            if (
                o.os == 'mac' &&
                ('ontouchstart' in window) &&
                (
                    (screen.width == 1024 && screen.height == 1366) ||  // iPad Pro 12.9"
                    (screen.width == 834 && screen.height == 1112) ||   // iPad Pro 10.5"
                    (screen.width == 810 && screen.height == 1080) ||   // iPad Air 4
                    (screen.width == 768 && screen.height == 1024)      // Standard iPad
                )
            ) 
                o.os = 'ios';
            
    
            // Set the mobile flag if the OS is Android or iOS
            o.mobile = (o.os == 'android' || o.os == 'ios');
    
            // Create a temporary div for feature detection
            var _canUse = document.createElement('div');
    
            // Function to check if a CSS property is supported
            o.canUse = function(property, value) {
                var style; style = _canUse.style;
    
                // Check if the property exists in the style object
                if (!(property in style))
                    return false;
    
                // If a value is provided, test setting it
                if (typeof value !== 'undefined') {
                    style[property] = value;
                    if (style[property] == '') 
                        return false;
                }
    
                return true;
            };
    
            // Check if the browser supports "dynamic viewport units" (e.g., 100dvw)
            o.flags.lsdUnits = o.canUse('width', '100dvw');
    
            return o;
        })(),
    
        // Function to trigger a custom event
        trigger = function(t) {
            dispatchEvent(new Event(t));
        },
    
        // Function to find CSS rules matching a selector
        cssRules = function(selectorText) {
            var ss = document.styleSheets,  // Get all stylesheets
                a = [],                     // Array to store matching rules
                f = function(s) {            // Recursive function to search rules
                    var r = s.cssRules, i;
                    for (i = 0; i < r.length; i++) {
                        if (r[i] instanceof CSSMediaRule && matchMedia(r[i].conditionText).matches)
                            (f)(r[i]); // Recursively check media queries
                        else if (r[i] instanceof CSSStyleRule && r[i].selectorText == selectorText)
                            a.push(r[i]); // Store matching rules
                    }
                },
                x, i;
    
            // Iterate through stylesheets and search for rules
            for (i = 0; i < ss.length; i++)
                f(ss[i]);
    
            return a;
        },
    
        // Function to escape HTML characters to prevent XSS
        escapeHtml = function(s) {
            if (s === '' || s === null || s === undefined)
                return '';
    
            var a = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            };
    
            // Replace HTML special characters with escaped versions
            s = s.replace(/[&<>"']/g, function(x) {
                return a[x];
            });
    
            return s;
        },
    
        // Function to get the current hash from the URL
        thisHash = function() {
            var h = location.hash ? location.hash.substring(1) : null,
                a;
    
            if (!h)
                return null;
    
            // If the hash contains a query string, split it and update history
            if (h.match(/\?/)) {
                a = h.split('?');
                h = a[0];
    
                // Replace history state to keep only the hash
                history.replaceState(undefined, undefined, '#' + h);
                window.location.search = a[1]; // Set search parameters
            }
    
            // Ensure the hash starts with a valid character
            if (h.length > 0 && !h.match(/^[a-zA-Z]/))
                h = 'x' + h;
    
            // Convert hash to lowercase
            if (typeof h == 'string')
                h = h.toLowerCase();
    
            return h;
        };
        // Function to smoothly scroll to a specific element on the page
        scrollToElement = function(e, style, duration) {
            var y, cy, dy, start, easing, offset, f;
    
            // If no element is provided, scroll to the top
            if (!e)
                y = 0;
            else {
                // Calculate the scroll offset from the element's data attribute
                offset = (e.dataset.scrollOffset ? parseInt(e.dataset.scrollOffset) : 0) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    
                // Decide the scroll behavior based on the data attribute
                switch (e.dataset.scrollBehavior ? e.dataset.scrollBehavior : 'default') {
                    case 'default':
                    default:
                        // Scroll to the top of the element, plus offset
                        y = e.offsetTop + offset;
                        break;
                    case 'center':
                        // Scroll the element into the center of the viewport
                        if (e.offsetHeight < window.innerHeight)
                            y = e.offsetTop - ((window.innerHeight - e.offsetHeight) / 2) + offset;
                        else
                            y = e.offsetTop - offset;
                        break;
                    case 'previous':
                        // Scroll to the previous sibling element's position
                        if (e.previousElementSibling)
                            y = e.previousElementSibling.offsetTop + e.previousElementSibling.offsetHeight + offset;
                        else
                            y = e.offsetTop + offset;
                        break;
                }
            }
    
            // Default scroll style and duration
            if (!style) style = 'smooth';
            if (!duration) duration = 750;
    
            // If the style is 'instant', scroll immediately
            if (style == 'instant') {
                window.scrollTo(0, y);
                return;
            }
    
            // Start the animation
            start = Date.now();
            cy = window.scrollY;  // Current Y position
            dy = y - cy;          // Change in Y position
    
            // Easing functions based on scroll style
            switch (style) {
                case 'linear':
                    easing = function(t) { return t };  // Linear easing
                    break;
                case 'smooth':
                    easing = function(t) { 
                        return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;  // Smooth easing
                    };
                    break;
            }
    
            // Perform the scrolling animation
            f = function() {
                var t = Date.now() - start;
                if (t >= duration) {
                    window.scroll(0, y);  // Scroll to final position when the animation completes
                } else {
                    window.scroll(0, cy + (dy * easing(t / duration)));  // Scroll incrementally
                    requestAnimationFrame(f);  // Request the next animation frame
                }
            };
            f();
        },
    
        // Function to scroll to the top of the page
        scrollToTop = function() {
            scrollToElement(null);  // Scroll to the top (null argument triggers top scrolling)
        },
    
        // Function to load elements like iframes, videos, and autofocus fields
        loadElements = function(parent) {
            var a, e, x, i;
    
            // Load all iframes with a data-src attribute and set the content
            a = parent.querySelectorAll('iframe[data-src]:not([data-src=""])');
            for (i = 0; i < a.length; i++) {
                a[i].contentWindow.location.replace(a[i].dataset.src);  // Load the iframe source
                a[i].dataset.initialSrc = a[i].dataset.src;  // Save the initial source
                a[i].dataset.src = '';  // Clear the data-src to avoid reloading
            }
    
            // Play all autoplaying videos
            a = parent.querySelectorAll('video[autoplay]');
            for (i = 0; i < a.length; i++) {
                if (a[i].paused) a[i].play();  // Play the video if it's paused
            }
    
            // Autofocus on the appropriate element if it exists
            e = parent.querySelector('[data-autofocus="1"]');
            x = e ? e.tagName : null;
    
            // Check if the autofocus element is inside a form and focus the first field
            switch (x) {
                case 'FORM':
                    e = e.querySelector('.field input, .field select, .field textarea');
                    if (e) e.focus();  // Focus on the first field in the form
                    break;
                default:
                    break;
            }
        // Process all deferred script elements in the parent and replace them with actual script elements
        a = parent.querySelectorAll('deferred-script');
        for (i = 0; i < a.length; i++) {
            x = document.createElement('script');  // Create a new script element
            x.setAttribute('data-deferred', '');   // Add a data-deferred attribute to mark it as deferred
            if (a[i].getAttribute('src')) x.setAttribute('src', a[i].getAttribute('src'));  // Copy the src attribute if available
            if (a[i].textContent) x.textContent = a[i].textContent;  // Copy the textContent if available
            a[i].replaceWith(x);  // Replace the deferred-script element with the new script element
        }},
    
        // Function to unload elements like iframes and videos
        unloadElements = function(parent) {
            var a, e, x, i;
    
            // Unload iframes that have an empty src
            a = parent.querySelectorAll('iframe[data-src=""]');
            for (i = 0; i < a.length; i++) {
                if (a[i].dataset.srcUnload === '0') continue;  // Skip if srcUnload is set to '0'
                if ('initialSrc' in a[i].dataset)
                    a[i].dataset.src = a[i].dataset.initialSrc;  // Restore the initial src if available
                else
                    a[i].dataset.src = a[i].src;  // Save the current src as initialSrc
                a[i].contentWindow.location.replace('about:blank');  // Replace iframe content with blank page
            }
    
            // Pause all autoplaying videos
            a = parent.querySelectorAll('video');
            for (i = 0; i < a.length; i++) {
                if (!a[i].paused) a[i].pause();  // Pause video if it's playing
            }
    
            // Blur the currently focused element, if any
            e = $(':focus');
            if (e) e.blur();
        };
    
        // Function to scroll to the top of the page (already defined earlier)
        window._scrollToTop = scrollToTop;
    
        // Function to get the current URL, excluding the query parameters and hash
        var thisUrl = function() {
            return window.location.href.replace(window.location.search, '').replace(/#$/, '');
        };
    
        // Function to get a URL query parameter by its name
        var getVar = function(name) {
            var a = window.location.search.substring(1).split('&'), b, k;
            for (k in a) {
                b = a[k].split('=');
                if (b[0] == name) return b[1];  // Return the value of the parameter if found
            }
            return null;  // Return null if the parameter is not found
        };
    
        // Object for handling JavaScript errors
        var errors = {
            handle: function(handler) {
                window.onerror = function(message, url, line, column, error) {
                    (handler)(error.message);  // Call the provided handler with the error message
                    return true;  // Prevent default error handling
                };
            },
            unhandle: function() {
                window.onerror = null;  // Reset error handling to default
            }
        };
    
        // Function to find the scroll point section of an element's parent
        (function() {
            var initialSection, initialScrollPoint, initialId, header, footer, name, hideHeader, hideFooter, disableAutoScroll, h, e, ee, k, locked = false,
    
            // Function to find the section ancestor of a target element
            scrollPointParent = function(target) {
                while (target) {
                    if (target.parentElement && target.parentElement.tagName == 'SECTION') break;  // Break if the parent is a section
                    target = target.parentElement;
                }
                return target;
            },
    
            // Function to determine the scroll speed based on a scrollSpeed data attribute
            scrollPointSpeed = function(scrollPoint) {
                let x = parseInt(scrollPoint.dataset.scrollSpeed);
                switch (x) {
                    case 5: return 250;  // Very fast
                    case 4: return 500;  // Fast
                    case 3: return 750;  // Normal speed
                    case 2: return 1000; // Slow
                    case 1: return 1250; // Very slow
                    default: break;
                }
                return 750;  // Default scroll speed
            },
        // Function to go to the next scroll point in the page
    doNextScrollPoint = function(event) {
        var e, target, id;
        e = scrollPointParent(event.target); // Find the scroll point parent of the event target
        if (!e) return; // If there's no parent, exit the function
    
        // Loop through next siblings to find the next scrollable point
        while (e && e.nextElementSibling) {
            e = e.nextElementSibling;
            if (e.dataset.scrollId) { // If the sibling has a scroll point
                target = e;
                id = e.dataset.scrollId; // Get the target element and its scroll ID
                break;
            }
        }
    
        // If no target or scroll ID found, exit the function
        if (!target || !id) return;
    
        // If the target is invisible, scroll smoothly to it; else, jump to the anchor link
        if (target.dataset.scrollInvisible == '1')
            scrollToElement(target, 'smooth', scrollPointSpeed(target));
        else
            location.href = '#' + id;
    },
    
    // Function to go to the previous scroll point in the page
    doPreviousScrollPoint = function(e) {
        var e, target, id;
        e = scrollPointParent(event.target); // Find the scroll point parent of the event target
        if (!e) return;
    
        // Loop through previous siblings to find the previous scrollable point
        while (e && e.previousElementSibling) {
            e = e.previousElementSibling;
            if (e.dataset.scrollId) {
                target = e;
                id = e.dataset.scrollId; // Get the target element and its scroll ID
                break;
            }
        }
    
        // If no target or scroll ID found, exit the function
        if (!target || !id) return;
    
        // If the target is invisible, scroll smoothly to it; else, jump to the anchor link
        if (target.dataset.scrollInvisible == '1')
            scrollToElement(target, 'smooth', scrollPointSpeed(target));
        else
            location.href = '#' + id;
    },
    
    // Function to go to the first scroll point in the page
    doFirstScrollPoint = function(e) {
        var e, target, id;
        e = scrollPointParent(event.target); // Find the scroll point parent of the event target
        if (!e) return;
    
        // Loop through previous siblings to find the first scrollable point
        while (e && e.previousElementSibling) {
            e = e.previousElementSibling;
            if (e.dataset.scrollId) {
                target = e;
                id = e.dataset.scrollId; // Get the target element and its scroll ID
            }
        }
    
        // If no target or scroll ID found, exit the function
        if (!target || !id) return;
    
        // If the target is invisible, scroll smoothly to it; else, jump to the anchor link
        if (target.dataset.scrollInvisible == '1')
            scrollToElement(target, 'smooth', scrollPointSpeed(target));
        else
            location.href = '#' + id;
    },
    
    // Function to go to the last scroll point in the page
    doLastScrollPoint = function(e) {
        var e, target, id;
        e = scrollPointParent(event.target); // Find the scroll point parent of the event target
        if (!e) return;
    
        // Loop through next siblings to find the last scrollable point
        while (e && e.nextElementSibling) {
            e = e.nextElementSibling;
            if (e.dataset.scrollId) {
                target = e;
                id = e.dataset.scrollId; // Get the target element and its scroll ID
            }
        }
    
        // If no target or scroll ID found, exit the function
        if (!target || !id) return;
    
        // If the target is invisible, scroll smoothly to it; else, jump to the anchor link
        if (target.dataset.scrollInvisible == '1')
            scrollToElement(target, 'smooth', scrollPointSpeed(target));
        else
            location.href = '#' + id;
    },
    
    // Function to go to the next section on the page
    doNextSection = function() {
        var section;
        section = $('#main > .inner > section.active').nextElementSibling; // Get the next active section
        if (!section || section.tagName != 'SECTION') return; // If no section or not a section tag, exit
        location.href = '#' + section.id.replace(/-section$/, ''); // Navigate to the next section's ID
    },
    
    // Function to go to the previous section on the page
    doPreviousSection = function() {
        var section;
        section = $('#main > .inner > section.active').previousElementSibling; // Get the previous active section
        if (!section || section.tagName != 'SECTION') return;
        location.href = '#' + (section.matches(':first-child') ? '' : section.id.replace(/-section$/, '')); // Navigate to the previous section's ID
    },
    
    // Function to go to the first section on the page
    doFirstSection = function() {
        var section;
        section = $('#main > .inner > section:first-of-type'); // Get the first section
        if (!section || section.tagName != 'SECTION') return;
        location.href = '#' + section.id.replace(/-section$/, ''); // Navigate to the first section's ID
    },
    
    // Function to go to the last section on the page
    doLastSection = function() {
        var section;
        section = $('#main > .inner > section:last-of-type'); // Get the last section
        if (!section || section.tagName != 'SECTION') return;
        location.href = '#' + section.id.replace(/-section$/, ''); // Navigate to the last section's ID
    },
    
    // Function to reset form elements and other elements that require a reset when a section changes
    resetSectionChangeElements = function(section) {
        var ee, e, x;
        ee = section.querySelectorAll('[data-reset-on-section-change="1"]'); // Get elements that need resetting
        for (e of ee) {
            x = e ? e.tagName : null;
            switch (x) {
                case 'FORM': e.reset(); break; // Reset forms
                default: break;
            }
        }
    },
    // Function to activate a section with a smooth scroll point transition
    activateSection = function(section, scrollPoint) {
        var sectionHeight, currentSection, currentSectionHeight, name, hideHeader, hideFooter, disableAutoScroll, ee, k;
        
        // If the section is already active (not inactive), exit the function
        if (!section.classList.contains('inactive')) {
            name = (section ? section.id.replace(/-section$/, '') : null);
            disableAutoScroll = name ? ((name in sections) && ('disableAutoScroll' in sections[name]) && sections[name].disableAutoScroll) : false;
    
            // If scrollPoint is provided, scroll to it smoothly; otherwise, scroll to the top
            if (scrollPoint) scrollToElement(scrollPoint, 'smooth', scrollPointSpeed(scrollPoint)); 
            else if (!disableAutoScroll) scrollToElement(null);
            return false;
        } else {
            locked = true; // Locking the section to prevent changes during transitions
            if (location.hash == '#home') history.replaceState(null, null, '#'); // Reset home hash if on home page
    
            name = (section ? section.id.replace(/-section$/, '') : null);
            disableAutoScroll = name ? ((name in sections) && ('disableAutoScroll' in sections[name]) && sections[name].disableAutoScroll) : false;
    
            // Find the current section that is not inactive
            currentSection = $('section:not(.inactive)');
    
            // If a current section exists, mark it as inactive and reset its elements
            if (currentSection) {
                currentSection.classList.add('inactive');
                unloadElements(currentSection); // Unload elements in the current section
                resetSectionChangeElements(currentSection); // Reset the section's elements
                setTimeout(function() {
                    currentSection.style.display = 'none'; // Hide the current section
                    currentSection.classList.remove('active'); // Remove active class
                }, 250); // Delay the transition
            }
    
            // Activate the new section after the transition
            setTimeout(function() {
                section.style.display = ''; // Make the section visible
                trigger('resize'); // Trigger resize event to adjust layout
                if (!disableAutoScroll) scrollToElement(null, 'instant'); // Scroll to top if auto scroll is enabled
                setTimeout(function() {
                    section.classList.remove('inactive'); // Remove the inactive class
                    section.classList.add('active'); // Add the active class to the section
                    setTimeout(function() {
                        loadElements(section); // Load elements in the section
                        if (scrollPoint) scrollToElement(scrollPoint, 'instant'); // Scroll to the given point instantly
                        locked = false; // Unlock the section after the transition
                    }, 500);
                }, 75); // Delay class switching for smoother transition
            }, 250); // Delay the section display update
        }
    },
    
    // Configuration for different sections with visibility settings
    sections = {
        'home': { hideFooter: true, }, // Home section hides the footer
        'welcome': { hideFooter: true, }, // Welcome section hides the footer
        'abenflix': { hideFooter: true, }, // Abenflix section hides the footer
        'catalogue': { hideFooter: true, }, // Catalogue section hides the footer
    };
    
    // Assign window functions for scroll points and section transitions
    window._nextScrollPoint = doNextScrollPoint;
    window._previousScrollPoint = doPreviousScrollPoint;
    window._firstScrollPoint = doFirstScrollPoint;
    window._lastScrollPoint = doLastScrollPoint;
    window._nextSection = doNextSection;
    window._previousSection = doPreviousSection;
    window._firstSection = doFirstSection;
    window._lastSection = doLastSection;
    // Function to scroll to the top of the page and update the URL with the active section's ID
    window._scrollToTop = function() {
        var section, id;
        
        // Scroll to the top of the page
        scrollToElement(null);
        
        // If the current active section exists, update the URL with its ID
        if (!!(section = $('section.active'))) {
            id = section.id.replace(/-section$/, ''); // Remove '-section' from the section's ID
            if (id == 'home') id = ''; // If the section is 'home', reset the ID to an empty string
            history.pushState(null, null, '#' + id); // Update the browser history with the section ID
        }
    };
    
    // Set scroll restoration behavior to manual to control scroll behavior explicitly
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    
    // Get references to the header and footer elements
    header = $('#header');
    footer = $('#footer');
    
    // Retrieve the hash from the URL
    h = thisHash();
    if (h && !h.match(/^[a-zA-Z0-9\-]+$/)) h = null; // Sanitize hash to allow only alphanumeric characters and dashes
    
    // Determine the initial scroll point and section based on the URL hash
    if (e = $('[data-scroll-id="' + h + '"]')) {
        initialScrollPoint = e;
        initialSection = initialScrollPoint.parentElement;
        initialId = initialSection.id;
    } else if (e = $('#' + (h ? h : 'home') + '-section')) {
        initialScrollPoint = null;
        initialSection = e;
        initialId = initialSection.id;
    }
    
    // If no initial section is found, default to the 'home' section
    if (!initialSection) {
        initialScrollPoint = null;
        initialSection = $('#' + 'home' + '-section');
        initialId = initialSection.id;
        history.replaceState(undefined, undefined, '#'); // Reset the URL hash to '#'
    }
    
    // Determine visibility and scroll behavior settings for the section
    name = (h ? h : 'home');
    hideHeader = name ? ((name in sections) && ('hideHeader' in sections[name]) && sections[name].hideHeader) : false;
    hideFooter = name ? ((name in sections) && ('hideFooter' in sections[name]) && sections[name].hideFooter) : false;
    disableAutoScroll = name ? ((name in sections) && ('disableAutoScroll' in sections[name]) && sections[name].disableAutoScroll) : false;
    
    // Hide the header and footer if the corresponding flags are set in the sections configuration
    if (header && hideHeader) {
        header.classList.add('hidden');
        header.style.display = 'none';
    }
    if (footer && hideFooter) {
        footer.classList.add('hidden');
        footer.style.display = 'none';
    }
    
    // Hide all sections except the initial one
    ee = $$('#main > .inner > section:not([id="' + initialId + '"])');
    for (k = 0; k < ee.length; k++) {
        ee[k].className = 'inactive'; // Mark the sections as inactive
        ee[k].style.display = 'none'; // Hide the sections
    }
    // Add 'active' class to the initial section and load its elements
    initialSection.classList.add('active');
    loadElements(initialSection);
    
    // Load the header and footer elements if they exist
    if (header) loadElements(header);
    if (footer) loadElements(footer);
    
    // Scroll to the top of the page unless auto-scroll is disabled
    if (!disableAutoScroll) scrollToElement(null, 'instant');
    
    // Set up an event listener to scroll to the initial scroll point when the page is fully loaded
    on('load', function() {
        if (initialScrollPoint) scrollToElement(initialScrollPoint, 'instant');
    });
    
    // Set up a listener for hash changes (URL fragment changes)
    on('hashchange', function(event) {
        var section, scrollPoint, h, e;
    
        // Prevent actions if the page is locked
        if (locked) return false;
    
        // Get the hash from the URL
        h = thisHash();
        if (h && !h.match(/^[a-zA-Z0-9\-]+$/)) return false; // Validate the hash
    
        // Find the scroll point associated with the hash
        if (e = $('[data-scroll-id="' + h + '"]')) {
            scrollPoint = e;
            section = scrollPoint.parentElement;
        } else if (e = $('#' + (h ? h : 'home') + '-section')) {
            scrollPoint = null;
            section = e;
        } else {
            scrollPoint = null;
            section = $('#' + 'home' + '-section');
            history.replaceState(undefined, undefined, '#'); // Reset the hash to '#'
        }
    
        // If the section exists, activate it
        if (!section) return false;
        activateSection(section, scrollPoint);
        return false;
    });
    
    // Set up a listener for click events
    on('click', function(event) {
        var t = event.target, tagName = t.tagName.toUpperCase(), scrollPoint, section;
    
        // Check if the clicked element is an inline element like <img>, <svg>, <span>, etc.
        switch (tagName) {
            case 'IMG':
            case 'SVG':
            case 'USE':
            case 'U':
            case 'STRONG':
            case 'EM':
            case 'CODE':
            case 'S':
            case 'MARK':
            case 'SPAN':
                // Traverse up the DOM tree to find an anchor (<a>) element
                while ( !!(t = t.parentElement) ) if (t.tagName == 'A') break;
                if (!t) return; // If no anchor is found, stop the function
                break;
            default:
                break;
        }
    
        // If the clicked element is an anchor with a hash link, handle the scroll behavior
        if (t.tagName == 'A' && t.getAttribute('href') !== null && t.getAttribute('href').substr(0, 1) == '#') {
            // If the scroll point is found and is invisible, prevent default action and activate the section
            if (!!(scrollPoint = $('[data-scroll-id="' + t.hash.substr(1) + '"][data-scroll-invisible="1"]'))) {
                event.preventDefault();
                section = scrollPoint.parentElement;
                if (section.classList.contains('inactive')) {
                    history.pushState(null, null, '#' + section.id.replace(/-section$/, '')); // Update the URL
                    activateSection(section, scrollPoint); // Activate the section
                } else {
                    scrollToElement(scrollPoint, 'smooth', scrollPointSpeed(scrollPoint)); // Smooth scroll to the point
                }
            }
            // If the hash is the same as the current hash, reset the URL and refresh the page
            else if (t.hash == window.location.hash) {
                event.preventDefault();
                history.replaceState(undefined, undefined, '#'); // Reset the hash
                location.replace(t.hash); // Navigate to the hash link
            }
        }
    });
    
    // End of script block
    })();
    
    var style, sheet, rule;
    style = document.createElement('style');
    style.appendChild(document.createTextNode(''));
    document.head.appendChild(style);
    sheet = style.sheet;
    
    // Client-specific styling adjustments for mobile devices
    if (client.mobile) {
        (function() {
            if (client.flags.lsdUnits) {
                document.documentElement.style.setProperty('--viewport-height', '100svh');
                document.documentElement.style.setProperty('--background-height', '100lvh');
            } else {
                var f = function() {
                    document.documentElement.style.setProperty('--viewport-height', window.innerHeight + 'px');
                    document.documentElement.style.setProperty('--background-height', (window.innerHeight + 250) + 'px');
                };
                on('load', f);
                on('orientationchange', function() {
                    setTimeout(function() {
                        (f)();
                    }, 100);
                });
            }
        })();
    }
    
    // Android-specific styling adjustments
    if (client.os == 'android') {
        (function() {
            sheet.insertRule('body::after { }', 0);
            rule = sheet.cssRules[0];
            var f = function() {
                rule.style.cssText = 'height: ' + (Math.max(screen.width, screen.height)) + 'px';
            };
            on('load', f);
            on('orientationchange', f);
            on('touchmove', f);
        })();
        $body.classList.add('is-touch');
    } else if (client.os == 'ios') {
        // iOS-specific adjustments
        if (client.osVersion <= 11) {
            (function() {
                sheet.insertRule('body::after { }', 0);
                rule = sheet.cssRules[0];
                rule.style.cssText = '-webkit-transform: scale(1.0)';
            })();
        }
        if (client.osVersion <= 11) {
            (function() {
                sheet.insertRule('body.ios-focus-fix::before { }', 0);
                rule = sheet.cssRules[0];
                rule.style.cssText = 'height: calc(100% + 60px)';
                on('focus', function(event) {
                    $body.classList.add('ios-focus-fix');
                }, true);
                on('blur', function(event) {
                    $body.classList.remove('ios-focus-fix');
                }, true);
            })();
        $body.classList.add('is-touch');
        }
    }
    // Scroll events configuration
    var scrollEvents = {
        items: [],
        add: function(o) {
            this.items.push({
                element: o.element,
                triggerElement: (('triggerElement' in o && o.triggerElement) ? o.triggerElement : o.element),
                enter: ('enter' in o ? o.enter : null),
                leave: ('leave' in o ? o.leave : null),
                mode: ('mode' in o ? o.mode : 4),
                threshold: ('threshold' in o ? o.threshold : 0.25),
                offset: ('offset' in o ? o.offset : 0),
                initialState: ('initialState' in o ? o.initialState : null),
                state: false,
            });
        },
    
    handler: function() {
        var height, top, bottom, scrollPad;
    
        // Adjust for iOS devices
        if (client.os == 'ios') {
            height = document.documentElement.clientHeight;
            top = document.body.scrollTop + window.scrollY;
            bottom = top + height;
            scrollPad = 125;
        } else {
            height = document.documentElement.clientHeight;
            top = document.documentElement.scrollTop;
            bottom = top + height;
            scrollPad = 0;
        }
    
        // Loop through scroll events
        scrollEvents.items.forEach(function(item) {
            var elementTop, elementBottom, viewportTop, viewportBottom, bcr, pad, state, a, b;
    
            // Skip items with no enter/leave actions or no trigger element
            if (!item.enter && !item.leave) return true;
            if (!item.triggerElement) return true;
    
            // If the trigger element is not visible, handle its state accordingly
            if (item.triggerElement.offsetParent === null) {
                if (item.state == true && item.leave) {
                    item.state = false;
                    (item.leave).apply(item.element);
                    if (!item.enter) item.leave = null;
                }
                return true;
            }
    
            bcr = item.triggerElement.getBoundingClientRect();
            elementTop = top + Math.floor(bcr.top);
            elementBottom = elementTop + bcr.height;
    
            // Set initial state if not already set
            if (item.initialState !== null) {
                state = item.initialState;
                item.initialState = null;
            } else {
                // Handle different modes for scroll event logic
                switch (item.mode) {
                    case 1:
                    default:
                        state = (bottom > (elementTop - item.offset) && top < (elementBottom + item.offset));
                        break;
                    case 2:
                        a = (top + (height * 0.5));
                        state = (a > (elementTop - item.offset) && a < (elementBottom + item.offset));
                        break;
                    case 3:
                        a = top + (height * (item.threshold));
                        if (a - (height * 0.375) <= 0) a = 0;
                        b = top + (height * (1 - item.threshold));
                        if (b + (height * 0.375) >= document.body.scrollHeight - scrollPad) b = document.body.scrollHeight + scrollPad;
                        state = (b > (elementTop - item.offset) && a < (elementBottom + item.offset));
                        break;
                    case 4:
                        pad = height * item.threshold;
                        viewportTop = (top + pad);
                        viewportBottom = (bottom - pad);
                        if (Math.floor(top) <= pad) viewportTop = top;
                        if (Math.ceil(bottom) >= (document.body.scrollHeight - pad)) viewportBottom = bottom;
                        if ((viewportBottom - viewportTop) >= (elementBottom - elementTop)) {
                            state = ((elementTop >= viewportTop && elementBottom <= viewportBottom) ||
                                (elementTop >= viewportTop && elementTop <= viewportBottom) ||
                                (elementBottom >= viewportTop && elementBottom <= viewportBottom));
                        } else {
                            state = ((viewportTop >= elementTop && viewportBottom <= elementBottom) ||
                                (elementTop >= viewportTop && elementTop <= viewportBottom) ||
                                (elementBottom >= viewportTop && elementBottom <= viewportBottom));
                        }
                        break;
                }
            }
    
            // If the state has changed, trigger the corresponding enter/leave actions
            if (state != item.state) {
                item.state = state;
                if (item.state) {
                    if (item.enter) {
                        (item.enter).apply(item.element);
                        if (!item.leave) item.enter = null;
                    }
                } else {
                    if (item.leave) {
                        (item.leave).apply(item.element);
                        if (!item.enter) item.leave = null;
                    }
                }
            }
        });
    },
    
    init: function() {
        on('load', this.handler);
        on('resize', this.handler);
        on('scroll', this.handler);
        (this.handler)();
    }
    };
    scrollEvents.init();
    
    // Lazy-loading image handling and event setup
    (function() {
        var items = $$('.deferred'),
            loadHandler, enterHandler;
    
        loadHandler = function() {
            var i = this, p = this.parentElement;
            if (i.dataset.src !== 'done') return;
    
            if (Date.now() - i._startLoad < 375) {
                p.classList.remove('loading');
                p.style.backgroundImage = 'none';
                i.style.transition = '';
                i.style.opacity = 1;
            } else {
                p.classList.remove('loading');
                i.style.opacity = 1;
                setTimeout(function() {
                    i.style.backgroundImage = 'none';
                    i.style.transition = '';
                }, 375);
            }
        };
    
        enterHandler = function() {
            var i = this, p = this.parentElement, src;
            src = i.dataset.src;
            i.dataset.src = 'done';
            p.classList.add('loading');
            i._startLoad = Date.now();
            i.src = src;
        };
    
        items.forEach(function(p) {
            var i = p.firstElementChild;
            if (!p.classList.contains('enclosed')) {
                p.style.backgroundImage = 'url(' + i.src + ')';
                p.style.backgroundSize = '100% 100%';
                p.style.backgroundPosition = 'top left';
                p.style.backgroundRepeat = 'no-repeat';
            }
            i.style.opacity = 0;
            i.style.transition = 'opacity 0.375s ease-in-out';
            i.addEventListener('load', loadHandler);
    
            scrollEvents.add({
                element: i,
                enter: enterHandler,
                offset: 250,
            });
        });
    })();
    
    // On-visible effects and transitions
    var onvisible = {
        effects: {
            'blur-in': {
                type: 'transition',
                transition: function (speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' + 'filter ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    this.style.opacity = 0;
                    this.style.filter = 'blur(' + (0.25 * intensity) + 'rem)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.filter = 'none';
                },
            },
            'zoom-in': {
                type: 'transition',
                transition: function (speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' + 'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity, alt) {
                    this.style.opacity = 0;
                    this.style.transform = 'scale(' + (1 - ((alt ? 0.25 : 0.05) * intensity)) + ')';
                },
                play: function(){
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'zoom-out': {
                // This defines a transition type for a zoom-out effect
                type: 'transition',
                transition: function (speed, delay) {
                    // 'opacity' and 'transform' properties will be animated with specified speed and delay
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity, alt) {
                    // Set opacity to 0 and scale the element out (zoom out) depending on intensity and alternative settings
                    this.style.opacity = 0;
                    this.style.transform = 'scale(' + (1 + ((alt ? 0.25 : 0.05) * intensity)) + ')';
                },
                play: function() {
                    // Set opacity to 1 and reset the scale transformation
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'slide-left': {
                // This defines a transition type for a slide-left effect
                type: 'transition',
                transition: function (speed, delay) {
                    // 'transform' (movement) property will be animated with specified speed and delay
                    return 'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function() {
                    // Move the element completely out of the view to the right
                    this.style.transform = 'translateX(100vw)';
                },
                play: function() {
                    // Reset the element's transform to its initial position (not moved)
                    this.style.transform = 'none';
                },
            },
            'slide-right': {
                type: 'transition',
                transition: function(speed,delay){
                    return 'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '' );
                },
                rewind: function() {
                    this.style.transform = 'translateX(-100vw)';
                },
                play: function() {
                    this.style.transform = 'none';
                },
            },
            'flip-forward': { 
                // Define the transition type and the properties it should have
                type: 'transition', 
                transition: function(speed, delay) {
                    // Specifies the animation for opacity and transformation
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' + 
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                }, 
                rewind: function(intensity, alt) {
                    // Rewind effect (reset the element's opacity and rotation based on intensity)
                    this.style.opacity = 0;
                    this.style.transformOrigin = '50% 50%'; // Center the transform
                    this.style.transform = 'perspective(1000px) rotateX(' + ((alt ? -45 : -15) * intensity) + 'deg)';
                }, 
                play: function() {
                    // The actual animation effect (make the element visible with no transformation)
                    this.style.opacity = 1; 
                    this.style.transform = 'none';
                }, 
            },
            'flip-backward':{
                type: 'transition',
                transition: function(speed,delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity,alt) {
                    this.style.opacity = 0;
                    this.style.transformOrigin = '50% 50%';
                    this.style.transform = 'perspective(1000px) rotateX(' + ((alt ? -45 : -15) * intensity) + 'deg)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'flip-left': { 
                type: 'transition', 
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' + 
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                }, 
                rewind: function(intensity, alt) {
                    // Rewind effect for flipping to the left (rotate the element around the Y-axis)
                    this.style.opacity = 0;
                    this.style.transformOrigin = '50% 50%'; 
                    this.style.transform = 'perspective(1000px) rotateY(' + ((alt ? 45 : 15) * intensity) + 'deg)';
                }, 
                play: function() {
                    // The actual flip animation to the left (make the element visible with no transformation)
                    this.style.opacity = 1; 
                    this.style.transform = 'none';
                }, 
            },
            'flip-right': { 
                type: 'transition', 
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' + 
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                }, 
                rewind: function(intensity, alt) {
                    // Rewind effect for flipping to the right (rotate the element around the Y-axis)
                    this.style.opacity = 0;
                    this.style.transformOrigin = '50% 50%'; 
                    this.style.transform = 'perspective(1000px) rotateY(' + ((alt ? -45 : -15) * intensity) + 'deg)';
                }, 
                play: function() {
                    // The actual flip animation to the right (make the element visible with no transformation)
                    this.style.opacity = 1; 
                    this.style.transform = 'none';
                }, 
            },
            'tilt-left': { 
                type: 'transition', 
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' + 
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                }, 
                rewind: function(intensity, alt) {
                    // Rewind effect for tilting to the left (rotate the element around the X-axis)
                    this.style.opacity = 0;
                    this.style.transform = 'rotate(' + ((alt ? 45 : 5) * intensity) + 'deg)';
                }, 
                play: function() {
                    // The actual tilt animation to the left (make the element visible with no transformation)
                    this.style.opacity = 1; 
                    this.style.transform = 'none';
                }, 
            },
            'tilt-right': { 
                type: 'transition', 
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' + 
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity, alt) {
                    this.style.opacity = 0;
                    this.style.transform = 'rotate(' + ((alt ? -45 : -5) * intensity) + 'deg)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'fade-right': {
                type: 'transition', 
                transition: function(speed, delay) {
                    // Specifies the animation for opacity and translation along the X-axis (move right)
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' + 
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    // Rewind effect for fading out and translating to the left along the X-axis
                    this.style.opacity = 0;
                    this.style.transform = 'translateX(' + (-1.5 * intensity) + 'rem)';
                },
                play: function() {
                    // The actual animation effect (make the element visible with no transformation)
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'fade-left': {
                type: 'transition', 
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' + 
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    // Rewind effect for fading out and translating to the right along the X-axis
                    this.style.opacity = 0;
                    this.style.transform = 'translateX(' + (1.5 * intensity) + 'rem)';
                },
                play: function() {
                    // The actual animation effect (make the element visible with no transformation)
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'fade-down': {
                type: 'transition', 
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' + 
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    // Rewind effect for fading out and translating upwards along the Y-axis
                    this.style.opacity = 0;
                    this.style.transform = 'translateY(' + (-1.5 * intensity) + 'rem)';
                },
                play: function() {
                    // The actual animation effect (make the element visible with no transformation)
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'fade-up': {
                type: 'transition', 
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' + 
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    // Rewind effect for fading out and translating downwards along the Y-axis
                    this.style.opacity = 0;
                    this.style.transform = 'translateY(' + (1.5 * intensity) + 'rem)';
                },
                play: function() {
                    // The actual animation effect (make the element visible with no transformation)
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'fade-in': {
                type: 'transition', 
                transition: function(speed, delay) {
                    // Specifies the animation for opacity (fade in)
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function() {
                    // Rewind effect for fading out (opacity goes to 0)
                    this.style.opacity = 0;
                },
                play: function() {
                    // The actual animation effect (fade in, opacity goes to 1)
                    this.style.opacity = 1;
                },
            },
            'fade-in-background': {
                type: 'manual', // This effect is manually triggered
                rewind: function() {
                    // Removes CSS variables for delay and background color
                    this.style.removeProperty('--onvisible-delay');
                    this.style.removeProperty('--onvisible-background-color');
                },
                play: function(speed, delay) {
                    // Sets the speed of the fade-in effect
                    this.style.setProperty('--onvisible-speed', speed + 's');
                    if (delay) 
                        // If there's a delay, set it as a CSS variable
                        this.style.setProperty('--onvisible-delay', delay + 's');
                    // Triggers the background fade-in effect using a very subtle opacity change
                    this.style.setProperty('--onvisible-background-color', 'rgba(0,0,0,0.001)');
                },
            },
            'zoom-in-image': {
                type: 'transition', // This effect is a transition-based animation
                target: 'img', // Targets image elements
                transition: function(speed, delay) {
                    // Defines the transition effect for the image zoom
                    return 'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function() {
                    // Resets the image scale to normal
                    this.style.transform = 'scale(1)';
                },
                play: function(intensity) {
                    // Increases the image size based on intensity
                    this.style.transform = 'scale(' + (1 + (0.1 * intensity)) + ')';
                },
            },
            'zoom-out-image': {
                type: 'transition', // Another transition-based animation
                target: 'img', // Targets image elements
                transition: function(speed, delay) {
                    // Defines the transition effect for the image zoom-out
                    return 'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    // Enlarges the image temporarily based on intensity
                    this.style.transform = 'scale(' + (1 + (0.1 * intensity)) + ')';
                },
                play: function() {
                    // Resets the image scale back to normal
                    this.style.transform = 'none';
                },
            },
            'focus-image': {
                type: 'transition', // Another transition effect
                target: 'img', // Applies to images
                transition: function(speed, delay) {
                    // Defines both scale (zoom) and filter (blur) transitions
                    return 'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'filter ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    // Applies a slight zoom and blur effect based on intensity
                    this.style.transform = 'scale(' + (1 + (0.05 * intensity)) + ')';
                    this.style.filter = 'blur(' + (0.25 * intensity) + 'rem)';
                },
                play: function(intensity) {
                    // Resets the image to normal scale and removes blur
                    this.style.transform = 'none';
                    this.style.filter = 'none';
                },
            },
            'wipe-up': {
                type: 'transition', // Defines a transition animation
                transition: function(speed, delay) {
                    // Specifies a mask transition for revealing content
                    return 'mask-size ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    // Sets up a masking effect for a wipe transition
                    this.style.maskComposite = 'exclude'; // Defines how the mask interacts with other elements
                    this.style.maskRepeat = 'no-repeat'; // Prevents the mask from repeating
                    this.style.maskImage = 'linear-gradient(0deg, black 100%, transparent 100%)'; // Creates a fade-out effect
                    this.style.maskPosition = '0% 100%'; // Starts the mask at the bottom
                    this.style.maskSize = '100% 0%'; // Initially makes the masked area invisible
                },
                play: function() {
                    // Expands the mask to fully reveal the element
                    this.style.maskSize = '110% 110%';
                },
            },
            'wipe-down': {
                type: 'transition', // Defines a transition animation
                transition: function(speed, delay) {
                    // Specifies a mask transition for a wipe effect
                    return 'mask-size ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    // Sets up the initial masking effect, hiding the element from the top down
                    this.style.maskComposite = 'exclude';
                    this.style.maskRepeat = 'no-repeat';
                    this.style.maskImage = 'linear-gradient(0deg, black 100%, transparent 100%)'; // Defines the wipe direction
                    this.style.maskPosition = '0% 0%'; // Starts the mask from the top
                    this.style.maskSize = '100% 0%'; // Initially hides the element
                },
                play: function() {
                    // Expands the mask to reveal the element from the top down
                    this.style.maskSize = '110% 110%';
                },
            },
            'wipe-left': {
                type: 'transition', // Defines a transition animation
                transition: function(speed, delay) {
                    return 'mask-size ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    // Hides the element by masking it from the right side
                    this.style.maskComposite = 'exclude';
                    this.style.maskRepeat = 'no-repeat';
                    this.style.maskImage = 'linear-gradient(90deg, black 100%, transparent 100%)'; // Wipes from right to left
                    this.style.maskPosition = '100% 0%'; // Mask starts at the far right
                    this.style.maskSize = '0% 100%'; // Initially hides the element
                },
                play: function() {
                    // Expands the mask to reveal the element from the right to the left
                    this.style.maskSize = '110% 110%';
                },
            },
            'wipe-right': {
                type: 'transition', // Defines a transition animation
                transition: function(speed, delay) {
                    return 'mask-size ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    // Hides the element by masking it from the left side
                    this.style.maskComposite = 'exclude';
                    this.style.maskRepeat = 'no-repeat';
                    this.style.maskImage = 'linear-gradient(90deg, black 100%, transparent 100%)'; // Wipes from left to right
                    this.style.maskPosition = '0% 0%'; // Mask starts at the far left
                    this.style.maskSize = '0% 100%'; // Initially hides the element
                },
                play: function() {
                    // Expands the mask to reveal the element from left to right
                    this.style.maskSize = '110% 110%';
                },
            },
            'wipe-diagonal': {
                type: 'transition', // Defines a transition animation
                transition: function(speed, delay) {
                    return 'mask-size ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    // Hides the element by masking it diagonally from the bottom-left to the top-right
                    this.style.maskComposite = 'exclude';
                    this.style.maskRepeat = 'no-repeat';
                    this.style.maskImage = 'linear-gradient(45deg, black 50%, transparent 50%)'; // Diagonal wipe effect
                    this.style.maskPosition = '0% 100%'; // Starts from the bottom-left corner
                    this.style.maskSize = '0% 0%'; // Initially hides the element
                },
                play: function() {
                    // Expands the mask to reveal the element diagonally
                    this.style.maskSize = '220% 220%';
                },
            },
            'wipe-reverse-diagonal': {
                type: 'transition', // Defines a transition animation
                transition: function(speed, delay) {
                    return 'mask-size ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    // Hides the element diagonally from the top-right to bottom-left
                    this.style.maskComposite = 'exclude';
                    this.style.maskRepeat = 'no-repeat';
                    this.style.maskImage = 'linear-gradient(135deg, transparent 50%, black 50%)'; // Reverse diagonal wipe
                    this.style.maskPosition = '100% 100%'; // Starts from the top-right corner
                    this.style.maskSize = '0% 0%'; // Initially hides the element
                },
                play: function() {
                    // Expands the mask to reveal the element diagonally
                    this.style.maskSize = '220% 220%';
                },
            },
            'pop-in': {
                type: 'animate', // Defines an animation effect
                keyframes: function(intensity) {
                    let diff = (intensity + 1) * 0.025; // Calculates scale variation based on intensity
                    return [
                        { opacity: 0, transform: 'scale(' + (1 - diff) + ')' }, // Start with smaller scale and hidden
                        { opacity: 1, transform: 'scale(' + (1 + diff) + ')' }, // Expand slightly
                        { opacity: 1, transform: 'scale(' + (1 - (diff * 0.25)) + ')', offset: 0.9 }, // Slight contraction near the end
                        { opacity: 1, transform: 'scale(1)' } // Settle at normal scale
                    ];
                },
                options: function(speed) {
                    return { duration: speed, iterations: 1 }; // Animation duration and iteration count
                },
                rewind: function() {
                    this.style.opacity = 0; // Hide the element when rewinding
                },
                play: function() {
                    this.style.opacity = 1; // Show the element when playing the animation
                },
            },
    },
    
    // Regular expression used for matching various character types
    regex: new RegExp('([a-zA-Z0-9\.\,\-\_\"\'\?\!\:\;\#\@\#$\%\&\(\)\{\}]+)', 'g'), 
    
    add: function(selector, settings) {
        var _this = this,
            style = settings.style in this.effects ? settings.style : 'fade', // Determines animation style
            speed = parseInt('speed' in settings ? settings.speed : 0), // Sets animation speed
            intensity = parseInt('intensity' in settings ? settings.intensity : 5), // Sets animation intensity
            delay = parseInt('delay' in settings ? settings.delay : 0), // Sets delay before animation
            replay = 'replay' in settings ? settings.replay : false, // Determines if animation should replay
            stagger = 'stagger' in settings ? (parseInt(settings.stagger) >= 0 ? parseInt(settings.stagger) : false) : false, // Staggering effect
            staggerOrder = 'staggerOrder' in settings ? settings.staggerOrder : 'default', // Order of staggered elements
            staggerSelector = 'staggerSelector' in settings ? settings.staggerSelector : null, // Selector for staggered elements
            threshold = parseInt('threshold' in settings ? settings.threshold : 3), // Scroll threshold for triggering animations
            state = 'state' in settings ? settings.state : null, // Tracks animation state
            effect = this.effects[style], // Retrieves the effect based on style
            enter, leave, scrollEventThreshold;
    
        // Disables animation if a specific flag is set
        if ('CARRD_DISABLE_ANIMATION' in window) {
            if (style == 'fade-in-background')
                $$(selector).forEach(function(e) {
                    e.style.setProperty('--onvisible-background-color', 'rgba(0,0,0,0.001)');
                });
            return;
        }
    
        // Determines the threshold for triggering scroll-based animations
        switch (threshold) {
            case 1:
                scrollEventThreshold = 0; // Triggers instantly
                break;
            case 2:
                scrollEventThreshold = 0.125;
                break;
            default:
            case 3:
                scrollEventThreshold = 0.25; // Default value
                break;
            case 4:
                scrollEventThreshold = 0.375;
                break;
            case 5:
                scrollEventThreshold = 0.475;
                break;
        }
    
        // Determines the effect type (transition or animation) and sets up enter/leave behaviors
        switch (effect.type) {
            default:
            case 'transition': 
                // Adjust intensity for transitions
                intensity = ((intensity / 10) * 1.75) + 0.25;
    
                // Function to apply the transition effect when element enters
                enter = function(children, staggerDelay = 0) {
                    var _this = this, transitionOrig;
    
                    // If effect targets a child element, select it
                    if (effect.target) 
                        _this = this.querySelector(effect.target);
    
                    // Store original transition settings
                    transitionOrig = _this.style.transition;
    
                    // Improve performance by hiding backface during animation
                    _this.style.setProperty('backface-visibility', 'hidden');
    
                    // Apply transition effect with computed speed and delay
                    _this.style.transition = effect.transition.apply(_this, [speed / 1000, (delay + staggerDelay) / 1000]);
                    effect.play.apply(_this, [intensity, !!children]);
    
                    // Restore original settings after animation completes
                    setTimeout(function() {
                        _this.style.removeProperty('backface-visibility');
                        _this.style.transition = transitionOrig;
                    }, (speed + delay + staggerDelay) * 2);
                };
    
                // Function to apply the transition effect when element leaves
                leave = function(children) {
                    var _this = this, transitionOrig;
    
                    // If effect targets a child element, select it
                    if (effect.target) 
                        _this = this.querySelector(effect.target);
    
                    // Store original transition settings
                    transitionOrig = _this.style.transition;
    
                    // Improve performance by hiding backface during animation
                    _this.style.setProperty('backface-visibility', 'hidden');
    
                    // Apply transition effect with computed speed
                    _this.style.transition = effect.transition.apply(_this, [speed / 1000]);
                    effect.rewind.apply(_this, [intensity, !!children]);
    
                    // Restore original settings after animation completes
                    setTimeout(function() {
                        _this.style.removeProperty('backface-visibility');
                        _this.style.transition = transitionOrig;
                    }, speed * 2);
                };
                break;
    
            case 'animate': 
                // Function to apply the animation effect when element enters
                enter = function(children, staggerDelay = 0) {
                    var _this = this;
    
                    // If effect targets a child element, select it
                    if (effect.target) 
                        _this = this.querySelector(effect.target);
    
                    // Delay animation start if needed
                    setTimeout(() => {
                        effect.play.apply(_this, []);
                        _this.animate(
                            effect.keyframes.apply(_this, [intensity]),
                            effect.options.apply(_this, [speed, delay])
                        );
                    }, delay + staggerDelay);
                };
    
                // Function to apply the animation effect when element leaves
                leave = function(children) {
                    var _this = this;
    
                    // If effect targets a child element, select it
                    if (effect.target) 
                        _this = this.querySelector(effect.target);
    
                    // Play animation in reverse on exit
                    let a = _this.animate(
                        effect.keyframes.apply(_this, [intensity]),
                        effect.options.apply(_this, [speed, delay])
                    );
    
                    a.reverse(); // Reverse animation to create a smooth exit effect
    
                    // When the reverse animation finishes, reset the element
                    a.addEventListener('finish', () => {
                        effect.rewind.apply(_this, []);
                    });
                };
                break;
            case 'manual': 
            // Function to apply the manual effect when element enters
                enter = function(children, staggerDelay = 0) {
                    var _this = this;
    
                    // If effect targets a child element, select it
                    if (effect.target) 
                        _this = this.querySelector(effect.target);
    
                    // Manually trigger the play effect with adjusted speed, delay, and intensity
                    effect.play.apply(_this, [speed / 1000, (delay + staggerDelay) / 1000, intensity]);
                };
    
                // Function to apply the manual effect when element leaves
                leave = function(children) {
                    var _this = this;
    
                    // If effect targets a child element, select it
                    if (effect.target) 
                        _this = this.querySelector(effect.target);
    
                    // Manually trigger the rewind effect
                    effect.rewind.apply(_this, [intensity, !!children]);
                };
                break;
    
                // Select all elements matching the provided selector and apply animation logic
                $$(selector).forEach(function(e) {
                    var children, targetElement, triggerElement;
    
                    // If stagger animation is enabled for direct children, expand text nodes
                    if (stagger !== false && staggerSelector == ':scope > *') 
                        _this.expandTextNodes(e);
    
                    // Retrieve all children matching the stagger selector if applicable
                    children = (stagger !== false && staggerSelector) ? e.querySelectorAll(staggerSelector) : null;
    
                    // Determine the target element for the effect (either specified target or the element itself)
                    targetElement = effect.target ? e.querySelector(effect.target) : e;
    
                    // Apply rewind effect to all children or just the target element
                    if (children) {
                        children.forEach(function(targetElement) {
                            effect.rewind.apply(targetElement, [intensity, true]);
                        });
                    } else {
                        effect.rewind.apply(targetElement, [intensity]);
                    }
    
                    // Determine the element that will trigger the effect (default is itself, but may be a parent)
                    triggerElement = e;
                    if (e.parentNode) {
                        if (e.parentNode.dataset.onvisibleTrigger) {
                            triggerElement = e.parentNode;
                        } else if (e.parentNode.parentNode) {
                            if (e.parentNode.parentNode.dataset.onvisibleTrigger) {
                                triggerElement = e.parentNode.parentNode;
                            }
                        }
                    }
    
                // Add a scroll event listener for triggering animations when the element becomes visible
                scrollEvents.add({
                    element: e,
                    triggerElement: triggerElement,
                    initialState: state,
                    threshold: scrollEventThreshold,
    
                    // Enter function handles animations, optionally with staggered delays
                    enter: children ? function() {
                        var staggerDelay = 0;
    
                        // Function to animate each child with staggered delay
                        var childHandler = function(e) {
                            enter.apply(e, [children, staggerDelay]);
                            staggerDelay += stagger;
                        };
    
                        var a;
                        if (staggerOrder == 'default') {
                            children.forEach(childHandler);
                        } else {
                            a = Array.from(children);
                            switch (staggerOrder) {
                                case 'reverse':
                                    a.reverse(); // Reverse order of animations
                                    break;
                                case 'random':
                                    a.sort(function() { return Math.random() - 0.5; }); // Shuffle order randomly
                                    break;
                            }
                            a.forEach(childHandler);
                        }
                    } : enter,
    
                    // Leave function removes the animation effect when element exits (if replay is enabled)
                    leave: (replay ? 
                        (children ? function() {
                            children.forEach(function(e) { leave.apply(e, [children]); });
                        } : leave) 
                        : null
                    ),
                });
            });
        }},
    expandTextNodes: function(e){
        var s, i, w, x;
        for (i = 0; i < e.childNodes.length; i++) {
            x = e.childNodes[i];
            if (x.nodeType !== Node.TEXT_NODE) continue;
            s = x.nodeValue;
            s = s.replace(this.regex, function(x, a) {
                return '<text-node>' + escapeHtml(a) + '</text-node>';
            });
            w = document.createElement('text-node');
            w.innerHTML = s;
            x.replaceWith(w);
            while (w.childNodes.length > 0) {
                w.parentNode.insertBefore(w.childNodes[0], w);
            }
            w.parentNode.removeChild(w);
        }
    }
    };
        
    // Apply on-visible effects to elements with specified animations
    onvisible.add('#image01', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 375, replay: false})
    onvisible.add('#text02', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 250, replay: true})
    onvisible.add('.image.style2', {style: 'fade-down', speed: 1250, intensity: 5, threshold: 3, delay: 500, replay: true})
    onvisible.add('#text03', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: true})
    onvisible.add('.image.style3', {style: 'fade-down', speed: 1250, intensity: 5, threshold: 3, delay: 750, replay: true})
    onvisible.add('#text04', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 750, replay: true})
    onvisible.add('.image.style4', {style: 'fade-down', speed: 1250, intensity: 5, threshold: 3, delay: 1000, replay: true})
    onvisible.add('#text09', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 1000, replay: true})
    onvisible.add('#image64', {style: 'fade-in', speed: 1000, intensity: 2, threshold: 3, delay: 1375, replay: true})
    onvisible.add('.image.style5', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('.icons.style1', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#text50', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 375, replay: true})
    onvisible.add('#text51', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: true})
    onvisible.add('#image74', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#text07', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 375, replay: true})
    onvisible.add('#text10', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: true})
    onvisible.add('#text52', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: true})
    onvisible.add('#text46', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#image75', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#image25', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 750, replay: false})
    onvisible.add('h1.style1, h2.style1, h3.style1, p.style1', { style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false })
    onvisible.add('.image.style1', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: false})
    onvisible.add('#image226', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: false})
    onvisible.add('.image.style6', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: false})
    onvisible.add('#text42', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#icons05', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#video01', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 375, replay: true})
    onvisible.add('#image20', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 625, replay: true})
    onvisible.add('#image16', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 750, replay: true})
    onvisible.add('#image21', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 1000, replay: true})
    onvisible.add('#image76', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 1125, replay: true})
    onvisible.add('#image77', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 1250, replay: true})
    onvisible.add('#image78', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 1375, replay: true})
    onvisible.add('#image112', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: false})
    onvisible.add('.video.style1', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text22', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text23', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#image40', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons15', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#text24', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text25', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text26', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text13', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text27', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text37', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text14', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text16', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text28', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#image66', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: true})
    onvisible.add('#text29', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#image46', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons21', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image67', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: true})
    onvisible.add('#text30', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#image47', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons22', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#text31', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#image48', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons23', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#text32', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#image49', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons24', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#text33', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#image72', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons25', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#text34', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#image58', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons27', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image87', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: false})
    onvisible.add('#image131', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: false})
    onvisible.add('#image114', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: false})
    onvisible.add('#image115', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: false})
    onvisible.add('#text47', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text49', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text08', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text12', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text36', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text56', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text48', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text70', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#container110', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#container100', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#text69', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text59', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons36', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#text61', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text19', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('.buttons.style1', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#text62', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text41', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text63', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text45', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text64', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text15', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#image103', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: false})
    onvisible.add('#text65', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text44', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text66', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text38', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#image105', {style: 'fade-down', speed: 1000, intensity: 5, threshold: 3, delay: 500, replay: false})
    onvisible.add('#text67', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text39', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#image133', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons48', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#container107', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#image116', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons49', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#container16', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#image122', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons50', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image151', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons52', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#container113', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#image73', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#container105', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#image146', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons53', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#container116', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#image167', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons54', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#container129', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#image142', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons55', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image192', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons67', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#container143', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#container141', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#text55', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#text74', {style: 'zoom-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#video36', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#image189', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons66', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#video37', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#video38', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#video39', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#video40', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#video41', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#video42', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#video43', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#video44', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#video45', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#video46', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#image145', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons56', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image180', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons57', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image181', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons58', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image182', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons59', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image183', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons60', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image184', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons61', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image185', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons62', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image186', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons63', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image32', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons07', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image187', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons64', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#image188', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})
    onvisible.add('#icons65', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 125, replay: true})
    onvisible.add('#video35', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: false})
    onvisible.add('#image83', {style: 'fade-in', speed: 1000, intensity: 5, threshold: 3, delay: 0, replay: true})       
    })();