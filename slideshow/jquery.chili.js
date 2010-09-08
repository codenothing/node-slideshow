/*!
 * Chili - the jQuery plugin for highlighting code
 * http://noteslog.com/chili/
 * 
 * Copyright 2010 Andrea Ercolino
 * Dual licensed under the MIT and GPL licenses.
 * http://docs.jquery.com/License
 * 
 * VERSION: NEXT - 20100413 0047
 */

(function( $ ) 
{
    
    $.extend({
    	chili: {
    		options: {  
                whiteSpace: {
                    tabWidth:  4,    //spaces
                    no1stLine: true  //if empty
                },
                automatic: {
                    active:    true,
                    selector:  "pre",
                    context:   document
                },
    	        dynamic: {
                    active:    true,
                    origin:    'recipes/'    //used like: recipeFolder + recipeName + '.js'
                },
                decoration: {
                    lineNumbers: !true
                },
                selection: {
                    active:    true,
                    box: {
                        style: [ 
                            "position:absolute; z-index:3000; overflow:scroll;",
                            "width:16em;",
                            "height:9em;",
                            "border:1px solid gray;",
                            "padding:1em;",
                            "background-color:white;"
                        ].join(' '),
                        top:   function(pageX, pageY, width, height)
                        {
                            var result = pageY - Math.round( height / 2 );
                            return result;
                        },
                        left:  function(pageX, pageY, width, height)
                        {
                            var result = pageX /*- Math.round( width / 2 )*/;
                            return result;
                        }
                    }
                }
        	}
    	}
    });
    
        
	$(function() 
    {
	    $.chili.loadStylesheetInline('.chili-ln-off {list-style-type: none;}');
	    $.extend($.chili, $.chili.options);
        
        if ($.chili.automatic.active) 
        {
            $($.chili.automatic.selector, $.chili.automatic.context).chili();
        }
    });
	
	    
    $.extend($.chili, {
        version: "next", // development started on 2010-01-06
        
        /**
         * Returns the language piece of data for the given dom_element
         * 
         * @param {Element} dom_element
         * 
         * @return String
         */
        codeLanguage: function( dom_element ) {
            var classes = $(dom_element).attr('class');
            var matches = classes.match(/\bchili-lang-(\w+)/);
            var result = matches ? matches[1] : '';
            return result;
        },
        
        /**
         * Returns the line numbers data for the given dom_element
         * 
         * @param {Element} dom_element
         * 
         * @return Array
         */
        codeLineNumbers: function( dom_element ) {
            var classes = $(dom_element).attr('class');
            var matches = classes.match(/\bchili-ln-(\d+)-([\w][\w\-]*)|\bchili-ln-(\d+)/);
            var result = ! matches 
                ? null
                : matches[3] 
                    ? [ matches[0], matches[3], '' ] 
                    : [ matches[0], matches[1], matches[2] ];
            return result;
        },
        
        /**
         * Returns the codes of any character of the given text
         * (Used for developing Chili)
         * 
         * @param {String} text
         * 
         * @return String
         */
        revealChars: function ( text ) 
        {
            var result = [];
            for (var i=0, iTop=text.length; i<iTop; i++)
            {
                result.push(text[i] + ' <- ' + text.charCodeAt(i));
            }
            result = result.join('\n');
            return result;
        },
        
        /**
         * Loads the given CSS code as a new style element of head
         * 
         * @param {string} sourceCode
         */
        loadStylesheetInline: function ( sourceCode ) 
        { 
            if ( document.createElement ) 
            { 
                var style_element = document.createElement( "style" ); 
                style_element.type = "text/css"; 
                if ( style_element.styleSheet ) 
                {
                    style_element.styleSheet.cssText = sourceCode; // IE
                }  
                else 
                { 
                    var t = document.createTextNode( sourceCode ); 
                    style_element.appendChild( t ); 
                } 
                var head = document.getElementsByTagName( "head" )[0];
                head.appendChild( style_element ); 
            } 
        },
        
        queue: {},
        
        recipes: {},
        
        filters: {
            off: function() {
                return this.text;
            }
        }
    });
    
    
    /**
     * Highlights currently selected elements accordingly to the given options
     * 
     * @param {Object} options
     */
    $.fn.chili = function( options ) 
    {
        var globals = $.extend({}, $.chili);
        $.chili = $.extend( true, $.chili, options || {} );
        this.each(function() 
        {
            askDish( this );
        });
        $.chili = globals;
        return this;
    };
    
    /**
     * Returns the recipe path from the given recipeName
     * 
     * @param {String} recipeName
     * 
     * @return String
     */
    function getRecipePath( recipeName ) 
    {
        var result = $.chili.dynamic.origin + 'jquery.chili.recipes.' + recipeName + '.js';
        return result;
    }
    
    /**
     * Returns the recipe name from the given recipePath
     * 
     * @param {String} recipePath
     * 
     * @return String
     */
    function getRecipeName( recipePath )
    {
        var matches = recipePath.match(/\bjquery\.chili\.recipes\.([\w-]+)\.js$/i);
        var result = matches[1];
        return result;
    }
    
    /**
     * Detects the recipe to use for highlighting the given DOM element and 
     * makes it happen, for static and dynamic setups
     * 
     * @param {Element} dom_element
     */
    function askDish( dom_element ) 
    {
        var recipeName = $.chili.codeLanguage( dom_element );
        if ( '' == recipeName )
            return;
        var path = getRecipePath( recipeName );
        if ( $.chili.dynamic.active && ! $.chili.recipes[ recipeName ] ) 
        {
            // dynamic setups come here
            if ( ! $.chili.queue[ path ] ) 
            {
                downloadRecipe(path, makeDish, [path]);
            }
            $.chili.queue[ path ].push( dom_element );
        }
        else 
        {
            // static setups come here
            $(dom_element).trigger( 'chili.before_coloring', [recipeName] );
            makeDish.apply( dom_element, [path] );
            $(dom_element).trigger( 'chili.after_coloring', [recipeName] );
        }
    }
    
    /**
     * Highlights the current DOM element using the recipe identified by the
     * given recipePath
     */
    function makeDish( recipePath ) 
    {
        var recipeName = getRecipeName(recipePath);
        var recipe = $.chili.recipes[ recipeName ];
        if (! recipe) 
            return;
        var ingredients = $( this ).text();
        if (! ingredients) 
            return;
        ingredients = fixWhiteSpaceAfterReading(ingredients);
        replaceElement.apply({
            selector: this, 
            subject:  ingredients, 
            module:   recipeName, 
            context:  {}
        });
        fixTextSelection(this);
        checkLineNumbers(this);
    }
    
    /**
     * Replaces source code in the given DOM element with its highlighted 
     * version
     */
    function replaceElement()
    {
        filtersPrepare(this);
        var replacement = applyModule( this.subject, this.module, this.context );
        replacement = filtersProcess(this, replacement);
        
        replacement = fixWhiteSpaceBeforeWriting( replacement );
        
        var dom_element = $( this.selector )[0];
        dom_element.innerHTML = replacement;
    }
    
        
    /**
     * Returns the requested action according to the empty configuration of 
     * the given values
     * 
     * @param {String} recipeName
     * @param {String} blockName
     * @param {String} stepName
     * 
     * @return String
     */
    function requestedAction( recipeName, blockName, stepName ) 
    {
        if ( '' != stepName )   return 'applyStep';
        if ( '' != blockName )  return 'applyBlock';
        if ( '' != recipeName ) return 'applyRecipe';
        return '';
    }
    
    /**
     * Returns the interpretation of the given module into the given context
     * 
     * @param {String} module
     * @param {Object} context
     * 
     * @return Object
     */
    function detectAction( module, context )
    {
        if (! module)   return;
        var re = new RegExp('^(?!(?:/$|.+/$|.+//$|.+//.))([^/]*)(?:/([^/]*)(?:/([^/]+))?)?$');
        var matches = (module || '').match(re);
        if (! matches)  return; // Expected recipe[/block[/step]] module format
        var recipeName = matches[1] || '';
        var blockName  = matches[2] || '';
        var stepName   = matches[3] || '';
        var action = requestedAction( recipeName, blockName, stepName );
        var recipe = getRecipe( recipeName, context );
        var result = {
              action:     action
            , recipeName: recipeName 
            , blockName:  blockName
            , stepName:   stepName
            , recipe:     recipe
            , module:     module
            , context:    context
        };
        return result;
    }
    
    /**
     * Returns the cached recipe with the given recipeName if recipeName is 
     * not empty, else the recipe from context
     * 
     * @param {String} recipeName
     * @param {Object} context
     * 
     * @return Object
     */
    function getRecipe( recipeName, context ) 
    {
        var recipe = null;
        if ( '' == recipeName )
        {
            recipe = context.recipe;
        }
        else 
        {
            recipe = $.chili.recipes[ recipeName ];
        }
        return recipe;
    }
    
    /**
     * Downloads a recipe by means of an ajax call and, on success, applies 
     * the cbFunction callback, passing it all cbData array elements as 
     * arguments, to any element waiting for being highlighted on the queue 
     * of the recipe identified by path
     *
     * @param {String} path
     * @param {Function} cbFunction
     * @param {Array} cbData
     */
    function downloadRecipe( path, cbFunction, cbData )
    {
        $.chili.queue[ path ] = [];
        $.getScript( path, function( recipeLoaded ) 
        {
            var recipeName = getRecipeName( path );
            var q = $.chili.queue[ path ];
            for( var i = 0, iTop = q.length; i < iTop; i++ )
            {
                var el = q[ i ];
                if ('undefined' != typeof el.selector) 
                {
                    el = $(el.selector)[0];
                }
                $(el).trigger( 'chili.before_coloring', [recipeName] );
                cbFunction.apply(q[ i ], cbData);
                $(el).trigger( 'chili.after_coloring', [recipeName] );
            }
        } );
    }
    
    /**
     * Returns the result of applying the given detected recipe to the given
     * subject
     * 
     * @param {String} subject
     * @param {Object} detected
     * 
     * @return String
     */
    function applyRecipe( subject, detected )
    {
        var recipe = detected.recipe;
        result = cook(subject, recipe);
        return result;
    }
    
    /**
     * Returns the result of applying the given detected block to the given
     * subject
     * 
     * @param {String} subject
     * @param {Object} detected
     * 
     * @return String
     */
    function applyBlock( subject, detected )
    {
        var blockName = detected.blockName;
        var recipe    = detected.recipe;
        if (! (blockName in recipe)) 
        {
            result = escapeHtmlSpecialChars(subject);
        }
        else
        {
            result = cook(subject, recipe, blockName);
        }
        return result;
    }
    
    /**
     * Returns the result of applying the given detected step to the given
     * subject
     * 
     * @param {String} subject
     * @param {Object} detected
     * 
     * @return String
     */
    function applyStep( subject, detected )
    {
        var recipeName = detected.recipeName;
        var blockName  = detected.blockName;
        var stepName   = detected.stepName;
        var recipe     = detected.recipe;
        var context    = detected.context;
        if ('' == blockName) 
        {
            blockName = context.blockName;
        }
        if (false
            || ! (blockName in recipe)
            || ! (stepName  in recipe[blockName]))
        {
            result = escapeHtmlSpecialChars(subject);
        }
        else
        {
            result = cook(subject, recipe, blockName, stepName);
        }
        return result;
    }
    
    /**
     * Returns the result of applying the given detected action to the given
     * subject
     * 
     * @param {String} subject
     * @param {Object} detected
     * 
     * @return String
     */
    function applyAction( subject, detected )
    {
        var result = '';
        var action = detected.action;
        switch (action)
        {
            case 'applyRecipe':
                result = applyRecipe(subject, detected);
            break;
            case 'applyBlock':
                result = applyBlock(subject, detected);
            break;
            case 'applyStep':
                result = applyStep(subject, detected);
            break;
            default:
                //nothing to do
            break;
        }
        return result;
    }
    
    /**
     * Returns the result of applying the given detected action to the given
     * subject
     * 
     * @param {String} subject
     * @param {Object} detected
     * 
     * @return String
     */
    function applyDeferred( subject, detected )
    {
        // dynamic setups come here too
        var path = getRecipePath(detected.recipeName);
        if (! $.chili.queue[ path ]) 
        {
            downloadRecipe(path, replaceElement);
        }
        var cue = 'chili_' + unique();
        $.chili.queue[ path ].push( {
            selector: '#' + cue, 
            subject:  subject, 
            module:   detected.module, 
            context:  detected.context
        } );
        result = '<span id="' + cue + '">' + result + '</span>';
        return result;
    }

    /**
     * Returns the result of applying the given module to the given subject 
     * into the given context
     * 
     * @param {String} subject
     * @param {String} module
     * @param {Object} context
     * 
     * @return String
     */
    function applyModule( subject, module, context ) 
    {
        var result = '';
        var detected = detectAction(module, context);
        if (typeof detected == 'undefined')
        {
            result = escapeHtmlSpecialChars(subject);
        }
        else if (detected.recipe)
        {
            result = applyAction(subject, detected);
        }
        else if ( $.chili.dynamic.active ) 
        {
            result = applyDeferred(subject, detected);
        }
        else
        {
            result = escapeHtmlSpecialChars(subject);
        }
        return result;
    }
    
    /**
     * Returns a unique number. If the given text is not undefined the 
     * return value is guaranteed to be unique inside text
     * 
     * @param {String} text
     * 
     * @return Integer
     */
    function unique( text ) 
    {
        var result = (new Date()).valueOf();
        while( text && text.indexOf( result ) > -1 );
        { 
            result = (new Date()).valueOf();
        }
        return result;
    }
    
        
    /**
     * Returns all the steps of the given blockName of the given recipe
     * 
     * @param {String} recipe
     * @param {String} blockName
     * 
     * @return Array
     */
    function prepareBlock( recipe, blockName ) 
    {
        var steps = [];
        var block = recipe[ blockName ];
        for( var stepName in block ) 
        {
            var prepared = prepareStep( recipe, blockName, stepName );
            steps.push( prepared );
        }
        return steps;
    }
    
    /**
     * Returns the number of sub matches in the given regular expression (as
     * a string)
     * 
     * @param {String} re
     * 
     * @return integer
     */
    function numberOfSubmatches( re )
    {
        var submatches = re
            .replace( /\\./g, "%" )     // disable any escaped character
            .replace( /\[.*?\]/g, "%" ) // disable any character class
            .match( /\((?!\?)/g )       // match any open parenthesis, not followed by a ?
        ;
        var result = (submatches || []).length;
        return result;
    }
    
    /**
     * Returns a step built from the given stepName of the given blockName 
     * of the given recipe
     * 
     * @param {String} recipe
     * @param {String} blockName
     * @param {String} stepName
     * 
     * @return Object
     */
    function prepareStep( recipe, blockName, stepName ) 
    {
        var step = recipe[ blockName ][ stepName ];
        var exp = ( typeof step._match == "string" ) 
            ? step._match 
            : step._match.source;
        var replacement = step._replace 
            ? step._replace 
            : '<span class="$0">$$</span>';
        var result = {
            recipe:      recipe,
            blockName:   blockName,
            stepName:    stepName,
            exp:         '(' + exp + ')', // new exp will have 1 more submatch
            length:      numberOfSubmatches( exp ) + 1,
            replacement: replacement
        };
        return result;
    }
    
    /**
     * Returns the given steps, with back references in the regular 
     * expression of each step renumbered according to the number of back 
     * references found in any previous step
     *
     * @param {Array} steps
     * 
     * @return Array
     */
    function adjustBackReferences( steps )
    {
        var prevLength = 1;
        var exps = [];
        for (var i = 0, iTop = steps.length; i < iTop; i++) {
            var exp = steps[ i ].exp;
            exp = exp.replace( /\\\\|\\(\d+)/g, 
                function( m, aNum ) 
                {
                    return !aNum ? m : "\\" + ( prevLength + 1 + parseInt( aNum, 10 ) );
                } 
            );
            exps.push( exp );
            prevLength += steps[ i ].length;
        }
        return exps;
    }
    
    /**
     * Returns a regular expression built from all the given steps
     * 
     * @param {Array} steps
     * 
     * @return RegExp
     */
    function knowHow( steps, flags ) 
    {
        var prolog = '((?:\\s|\\S)*?)';
        var epilog = '((?:\\s|\\S)+)';
        var exps = adjustBackReferences( steps );
        var source = '(?:' + exps.join( '|' ) + ')';
        source = prolog + source + '|' + epilog;
        return new RegExp( source, flags );
    }
    
    /**
     * Returns the given replacement, after adding the given prefix to all 
     * classes of all SPANs
     * 
     * @param {String} prefix
     * @param {String} replacement
     * 
     * @return String
     */
    function addPrefix( prefix, replacement ) 
    {
        var lookFor = /(<span\s+class\s*=\s*(["']))((?:(?!__)\w)+\2\s*>)/ig;
        var replaceWith = '$1' + prefix + '__$3';
        var aux = replacement.replace( lookFor, replaceWith );
        return aux;
    }
    
    /**
     * Returns the step in the given steps and its matches in the given
     * allMatches
     * 
     * @param {Object} steps       the steps of a recipe
     * @param {Array}  allMatches  the corresponding matches
     * 
     * @return Object
     */
    function locateStepMatches( steps, allMatches )
    {
        var matchesIndex = 2;
        for (var i = 0, iTop = steps.length; i < iTop; i++)
        {
            var step = steps[ i ];
            var stepMatches = allMatches[ matchesIndex ];
            if (stepMatches) break;
            matchesIndex += step.length;
        }
        var matches  = allMatches.slice(matchesIndex, matchesIndex + step.length);
        matches.push( allMatches.index );
        matches.push( allMatches.input );
        return {step: step, matches: matches};
    }
    
    /**
     * Returns the replacement for the given stepMatches, based on the
     * function in stepMatches.step.replacement
     * 
     * @param {Object} stepMatches
     * 
     * @return String
     */
    function functionReplacement( stepMatches ) 
    {
        var that = 
        { 
            x: function( subject, module ) 
            { 
                var result = applyModule( subject, module, stepMatches.step );
                return result;
            }
        };
        var result = stepMatches.step.replacement.apply(that, stepMatches.matches);
        return result;
    }   
    
    /**
     * Returns the replacement for the given stepMatches, based on the
     * template in stepMatches.step.replacement
     * 
     * @param {Object} stepMatches
     * 
     * @return String
     */
    function templateReplacement( stepMatches )
    {
        var re = /(\\\$)|(?:\$\$)|(?:\$(\d+))/g;
        var substitution = function( m, escaped, K ) 
        {
            var result = '';
            if ( escaped )        /* \$ */ 
            {
                result = "$";
            }
            else if ( !K )        /* $$ */ 
            {
                result = escapeHtmlSpecialChars( stepMatches.matches[ 0 ] ); //stepMatches
            }
            else if ( K == "0" )  /* $0 */ 
            {
                result = stepMatches.step.stepName;
            }
            else                  /* $K */
            {
                result = escapeHtmlSpecialChars( stepMatches.matches[ K ] );
            }
            return result;
        };
        var result = stepMatches.step.replacement.replace(re, substitution);
        return result;
    }
    
    /**
     * Returns the replacement for any match found. This is a callback 
     * function passed to String.replace()
     * 
     * @return String
     */
    function chef( steps, replaceArgs ) 
    {
        var result = '';
        var anyMatch = replaceArgs[ 0 ];
        if (! anyMatch) return result;
        
        var epilog = replaceArgs[ replaceArgs.length - 1 ];
        if (epilog) {
            result = escapeHtmlSpecialChars( epilog );
            return result;
        }
        var stepMatches = locateStepMatches( steps, replaceArgs );
        result = $.isFunction(stepMatches.step.replacement)
            ? functionReplacement(stepMatches)
            : templateReplacement(stepMatches)
        ;
        var prolog = replaceArgs[ 1 ];
        prolog = escapeHtmlSpecialChars( prolog );
        result = addPrefix( stepMatches.step.recipe._name, result );
        result = prolog + result;
        return result;
    }
    
    /**
     * Returns the given subject, after replacing all the matches of the
     * given steps, of the given recipe
     *  
     * @param {String} subject
     * @param {Object} recipe
     * @param {Array}  steps
     * 
     * @return String
     */
    function applySteps( subject, recipe, steps )
    {
        var flags = recipe._case 
            ? "g" 
            : "gi";
        var expr = knowHow( steps, flags );
        var result = [];
        var matches;
        while ((matches = expr.exec(subject)) != null && matches[0] != '')
        {
            var element = chef(steps, matches);
            result.push(element);
        }
        result = result.join('');
        return result;
    }
    
    /**
     * Returns the given ingredients, after applying the given steName of
     * the given blockName of the given recipe to it
     * 
     * @param {String} ingredients
     * @param {Object} recipe
     * @param {String} blockName
     * @param {String} stepName
     * 
     * @return String
     */
    function cook( ingredients, recipe, blockName, stepName ) 
    {
        if (stepName) 
        {
            var step  = prepareStep(recipe, blockName, stepName);
            var steps = [step];
        }
        else
        {
            if (! blockName) 
            {
                blockName = '_main';
                checkSpices( recipe );
            }
            if (! blockName in recipe)
            {
                return escapeHtmlSpecialChars( ingredients );
            }
            var steps = prepareBlock(recipe, blockName);
        }
        var result = applySteps(ingredients, recipe, steps);
        return result;
    }
    
        
    /**
     * Returns a CSS class definition with the given className and the given
     * classStyle
     *
     * @param {String} className
     * @param {String} classStyle
     * 
     * @return String
     */
    function cssClassDefinition( className, classStyle )
    {
        var result = ''
            + '.' + className + '\n'
            + '{\n' 
            + '\t' + classStyle + '\n'
            + '}\n'
        ;
        return result;
    }
    
    /**
     * Returns the style sheet of the given recipe
     *
     * @param {Object} recipe
     * 
     * @return string
     */
    function makeStylesheet( recipe )
    {
        var name = recipe._name;
        var content = ['/* Chili -- ' + name + ' */'];
        for (var blockName in recipe) 
        {
            if ( blockName.search( /^_(?!main\b)/ ) >= 0 ) 
                continue; // if _bar but not _main nor foo
            var block = recipe[ blockName ];
            for (var stepName in block) 
            {
                var step = block[ stepName ];
                if (! '_style' in step) 
                    continue;
                var style_def = step[ '_style' ];
                if ( typeof style_def == 'string' ) 
                {
                    var oStyle = {};
                    oStyle[ stepName ] = style_def;
                    style_def = oStyle;
                }
                for (var className in style_def) 
                {
                    var stepClass = name + '__' + className;
                    var stepStyle = style_def[ className ];
                    var def = cssClassDefinition( stepClass, stepStyle );
                    content.push(def);
                }
            }
        }
        var result = content.join('\n');
        return result;
    }
    
    /**
     * If needed, generates and loads the style sheet of the given recipe 
     * into the current page
     * 
     * @param {Object} recipe
     */
    function checkSpices( recipe ) 
    {
        var name = recipe._name;
        if ( ! $.chili.queue[ name ] ) 
        {
            var stylesheet = makeStylesheet(recipe);
            $.chili.loadStylesheetInline(stylesheet);
            $.chili.queue[ name ] = true;
        }
    }
    
        
    /**
     * Returns the given sting padded to itself the given times
     * 
     * @param {String} string
     * @param {Number} times
     */
    function repeat( string, times )
    {
        var result = '';
        for (var i = 0; i < times; i++)
        {
            result += string;
        }
        return result;
    }
    
    /**
     * Returns the given text, with all &, <, and > replaced by their HTML
     * entities
     * 
     * @param {String} text
     * 
     * @return String
     */
    function escapeHtmlSpecialChars( text ) 
    {
        var result = text
            .replace( /&/g, "&amp;" )
            .replace( /</g, "&lt;" )
            .replace( />/g, "&gt;" )
        ;
        return result;
    }
    
    /**
     * Returns the given text, with all &, <, and > replaced to their HTML
     * entities
     * 
     * @param {String} text
     * 
     * @return String
     */
    function unescapeHtmlSpecialChars( text ) 
    {
        var result = text
            .replace( /&amp;/g, "&" )
            .replace( /&lt;/g,  "<" )
            .replace( /&gt;/g,  ">" )
        ;
        return result;
    }
    
    /**
     * Scans the given subject and calls the given callback, passing along 
     * the given args, for each piece of text or html tag it finds
     * 
     * @param {String} subject
     * @param {Function} callback
     * @param {Array} args
     */
    function scan( subject, callback, args )
    {
        args = args || [];
        var expr = /([\w\W]*?)(?:(<\w+[^>]*\/>)|(<\w+[^>]*>)|(<\/\w+[^>]*>))|([\w\W]+)/ig;
        var func = function(all, prolog, tag_empty, tag_open, tag_close, epilog) 
        {
            var realOffset = matches.index;
            var token;
            if (epilog)
            {
                token = tokenMake('text',  epilog, realOffset);
                callback.apply(token, args);
            }
            else
            {
                token = tokenMake('text',  prolog, realOffset);
                callback.apply(token, args);
                
                realOffset += prolog.length;
                if (tag_empty)
                {
                    token = tokenMake('empty', tag_empty, realOffset);
                }
                else if(tag_open)
                {
                    token = tokenMake('open', tag_open, realOffset);
                }
                else if(tag_close)
                {
                    token = tokenMake('close', tag_close, realOffset);
                }
                callback.apply(token, args);
            }
        };
        var matches;
        while ((matches = expr.exec(subject)) != null && matches[0] != '')
        {
            func.apply({}, matches);
        }
    }
    
    /**
     * Returns the given text, with all spaces replaced by the writingSpace 
     * string
     * 
     * @param {String} text
     * 
     * @return String
     */
    function escapeSpaces( text ) 
    {
        var writingSpace = $.chili.whiteSpace.writingSpace;
        var result = text.replace(/ /g, writingSpace);
        return result;
    }
    
    /**
     * Returns the given text, with all tabs replaced by the writingTab 
     * string
     * 
     * @param {String} text
     * 
     * @return String
     */
    function escapeTabs( text ) 
    {
        var writingTab = $.chili.whiteSpace.writingTab;
        var result = text.replace(/\t/g, writingTab);
        return result;
    }
    
    /**
     * Returns the given text, with all '\n' replaced by the browser new 
     * line string
     * 
     * @param {String} text
     * 
     * @return String
     */
    function lineFeedsToNewLines( text ) 
    {
        var writingNewLine = $.chili.whiteSpace.writingNewLine;
        var result = text.replace(/\n/g, writingNewLine);
        return result;
    }
    
    /**
     * Returns the given text, with all the browser new line strings 
     * replaced by '\n' 
     * 
     * @param {String} text
     * 
     * @return String
     */
    function newLinesToLineFeeds( text ) 
    {
        var result = text;
        result = result.replace(/&nbsp;<BR>/ig, '\n');
        result = result.replace(/\r\n?/g, '\n');
        return result;
    }
    
    /**
     * Sets white space constants into $.chili
     * 
     * @param {String} html
     */
    function setWhiteSpaceConstants( html )
    {
        $.chili.whiteSpace.writingSpace = '&#160;';
        $.chili.whiteSpace.writingTab = repeat('&#160;', $.chili.whiteSpace.tabWidth);
        $.chili.whiteSpace.writingNewLine = '\n';
        if (/\r\n?/.test(html))
        {
            if ($.browser.msie)
            {
                $.chili.whiteSpace.writingNewLine = '&#160;<br>';
            }
            else
            {
                $.chili.whiteSpace.writingNewLine = /\r\n/.test(html) 
                    ? '\r\n' 
                    : '\r';
            }
        }
    }
    
    /**
     * Returns the given text after making new lines uniform across 
     * all browsers
     *
     * @param {String} text
     * 
     * @return String
     */
    function fixWhiteSpaceAfterReading( html )
    {
        setWhiteSpaceConstants(html);
        var result = newLinesToLineFeeds(html);
        if ( $.chili.whiteSpace.no1stLine ) 
        {
            result = result.replace(/^\n/, '');
        }
        return result;
    }
    
    /**
     * Returns the given text after making new lines uniform across 
     * all browsers
     *
     * @param {String} html
     * 
     * @return String
     */
    function fixWhiteSpaceBeforeWriting( html )
    {
        var result = [];
        scan(html, function () 
        {
            var value = this.value;
            if (this.type == 'text')
            {
                value = escapeSpaces( value );
                value = escapeTabs( value );
                value = lineFeedsToNewLines( value );
            }
            result.push(value);
        });
        result = result.join('');
        return result;
    }
    
        
    /**
     * Wraps a given line into well formed open and close tags, based on the
     * given open stack
     * 
     * @param {String} line
     * @param {Array} open
     * 
     * @return Object
     */
    function well_form( line, open )
    {
        var close = [];
        var open_start = open.join('');
        scan(line, function()
        {
            if (this.type == 'open')
            {
                open.push(this.value);
            }
            else if (this.type == 'close')
            {
                open.pop();
            }
        });
        for (var i = 0, iTop = open.length; i < iTop; i++)
        {
            var tag_open  = open[i];
            var tag_close = tag_open.replace(/^<(\w+)[^>]*>$/, '</$1>');
            close.unshift(tag_close);
        }
        var close_end = close.join('');
        line = open_start + line + close_end;
        return {
            line:  line,
            open:  open
        };
    }
    
    /**
     * Converts lines inside the given dom_element to list items into an
     * ordered list element
     * 
     * @param {Element} dom_element
     * 
     * @return String
     */
    function makeOrderedList( html )
    {
        var open  = [];
        var expr = /(.*)\n/g;
        var func = function ( all, line ) 
        {
            var well_formed = well_form(line, open);
            open = well_formed.open;
            line = well_formed.line 
                ? '<li>' + well_formed.line + '</li>' 
                : '<li> </li>'; //leave a space in empty lines
            return line;
        };
        var result = html.replace(expr, func);
        result = '<ol>' + result + '</ol>';
        return result;
    }
    
    /**
     * Sets the start of the ol tag of the current DOM element
     * 
     * @param {String} groupStart
     * @param {String} groupId
     * @param {String} start
     */
    function setLineNumbersStart( all, groupStart, groupId )
    {
        var start = parseInt( groupStart, 10 );
        if ( groupId ) 
        {
            var $pieces = $( '.' + all );
            var pos = $pieces.index( this );
            $pieces
                .slice( 0, pos )
                .each( 
                    function() 
                    {
                        start += $( this ).find( 'li' ).length;
                    } 
                )
            ;
        }
        $(this).find( 'ol' ).attr('start', start);
        // refresh the window
        $('body')
            .width( $('body').width() - 1 )
            .width( $('body').width() + 1 )
        ;
    }
    
    /**
     * Make line numbers appear into the given dom_element
     * 
     * @param {Element} dom_element
     */
    function addLineNumbers( dom_element ) 
    {
        var html = $(dom_element).html();
        html = fixWhiteSpaceAfterReading(html);
        html = makeOrderedList( html );
        html = fixWhiteSpaceBeforeWriting(html);
        dom_element.innerHTML = html;
    }
    
    /**
     * If needed, adds line numbers with a proper start to the given 
     * dom_element
     * 
     * @param {Element} dom_element
     */
    function checkLineNumbers( dom_element )
    {
        var ln = $.chili.codeLineNumbers(dom_element);
        if (ln) 
        {
            addLineNumbers(dom_element);
            setLineNumbersStart.apply(dom_element, ln);
        }
        else if ($.chili.decoration.lineNumbers) 
        {
            addLineNumbers(dom_element);
        }
    }
    
        
    /**
     * Makes filters from tags into that.subject, adds those filters to that 
     * and cleans up that.subject
     * 
     * @param {Object} that
     */
    function filtersPrepare( that )
    {
        var subject = that.subject;
        if (! /{:\w+\(/.test(subject))
        {
            return;
        }
        var format = 0;
        var expr = /({:(\w+)\((|(?:(['"])[^\4\n]*(?:\\.[^\4\n]*)*\4)(?:\s*,\s*((['"])[^\6\n]*(?:\\.[^\6\n]*)*\6))*)\)\[)((?:.|\n)*?)(\]\2:})/g;
        var func = function(all, tag_open, callback, args, ignore4, ignore5, ignore6, target, tag_close, offset)
        {
            eval('args = [' + args + '];');
            var filter = {
                original: target,
                start:    offset - format, 
                count:    target.length, 
                callback: callback, 
                args:     args
            };
            format += tag_open.length + tag_close.length;
            if ($.isArray(that.filters))
            {
                that.filters.push(filter);
            }
            else
            {
                that.filters = [filter];
            }
            return target;
        };
        subject = escapeHtmlSpecialChars(subject);
        subject = subject.replace(expr, func);
        subject = unescapeHtmlSpecialChars(subject);
        that.subject = subject;
    }
    
    /**
     * Makes up a token object based on the given type, value and start
     * 
     * @param {String} type
     * @param {String} value
     * @param {Integer} start
     * 
     * @return Object
     */
    function tokenMake( type, value, start )
    {
        var result = {
            type:  type,
            value: value,
            start: start
        };
        return result;
    }
    
    /**
     * Splits the given html into its tags and texts
     * 
     * @param {String} html
     * 
     * @return Array
     */
    function tokenSplit( html )
    {
        var result = [];
        var format = 0;
        scan(html, function() 
        {
            switch (this.type)
            {
                case 'empty':
                case 'open':
                case 'close':
                    format += this.value.length;
                break;
                case 'text':
                    this.start -= format;
                    this.end = this.start + this.value.length;
                break;
                default:
                    throw "no type case for '" + this.type + "'";
                break;
            }
            result.push(this);
        });
        return result;
    }
    
    /**
     * Strips empty span tags from the given html
     * 
     * @param {String} html
     * 
     * @return String
     */
    function stripEmpties( html )
    {
        var result = html.replace(/<span[^>]+><\/span>/g, '');
        return result;
    }
    
    /**
     * Joins values of all tokens
     * 
     * @param {Array} tokens
     * 
     * @return String
     */
    function tokenJoin( tokens )
    {
        var result = [];
        for (var i = 0, iTop = tokens.length;  i < iTop;  i++)
        {
            result.push(tokens[i].value);
        }
        result = result.join('');
        result = stripEmpties(result);
        return result;
    }
    
    /**
     * Finds beginning and ending tokens in the given tokens that contain the
     * begin and end of the string that starts at the given start and whose 
     * length is the given count
     * 
     * @param {Array} tokens
     * @param {Integer} start
     * @param {Integer} count
     * 
     * @return {Object}
     */
    function tokenFind( tokens, start, count )
    {
        var end = start + count;
        var firstPos     = -1;
        var lastPos      = -1;
        var previousSpan = '';
        var firstSpan    = '';
        var lastSpan     = '';
        for (var i = 0, iTop = tokens.length;  i < iTop;  i++)
        {
            var token = tokens[i];
            if (token.type == 'open')
            {
                previousSpan = token.value;
            }
            else if (token.type == 'close')
            {
                previousSpan = '';
            }
            else
            {
                if (token.start <= start && start < token.end)
                {
                    firstPos = i;
                    firstSpan = previousSpan;
                }
                if (token.start <= end && end < token.end)
                {
                    lastPos = i;
                    lastSpan = previousSpan;
                }
                if (firstPos != -1 && lastPos != -1)
                {
                    break;
                }
            }
        }
        var result = {
            first: {
                position: firstPos, 
                span: firstSpan
            }, 
            last: {
                position: lastPos, 
                span: lastSpan
            }
        };
        return result;
    }
    
    /**
     * Returns the tokens that result from breaking in two given token at the 
     * given position; if the given span is not empty, two additional tokens are 
     * returned to leave the sequence well formed
     * 
     * @param {Object} token
     * @param {Integer} position
     * @param {String} span
     * 
     * @return {Object}
     */
    function tokenBreak( token, position, span )
    {
        var firstText = token.value.substr(0, position);
        var firstToken = tokenMake('text', firstText, token.start);
        firstToken.end = token.start + firstText.length;
        
        var secondText = token.value.substr(position);
        var secondToken = tokenMake('text', secondText, token.start + position);
        secondToken.end = token.start + position + secondText.length;
        
        var result = { 
            first:  [firstToken], 
            second: [secondToken] 
        };
        if (span)
        {
            result.first.push(tokenMake('close', '</span>'));
            result.second.unshift(tokenMake('open', span));
        }
        return result;
    }
    
    /**
     * Creates a new html token out of the given tokens and insert it at the 
     * right position into them. The token contains all the string that starts 
     * at the given start and whose length is the given count. 
     * Resulting tokens are well formed.
     * 
     * @param {Array} tokens
     * @param {Integer} start
     * @param {Integer} count
     * 
     * @return {Object}
     */
    function tokenExtract( tokens, start, count )
    {
        var end = start + count;
        
        var found = tokenFind(tokens, start, count);
        var beforeTokens = tokens.slice(0, found.first.position);
        var firstToken   = tokens[found.first.position];
        var middleTokens = tokens.slice(found.first.position + 1, found.last.position);
        var lastToken    = tokens[found.last.position];
        var afterTokens  = tokens.slice(found.last.position + 1);
        
        var firstTokens = tokenBreak(firstToken, start - firstToken.start, found.first.span);
        var lastTokens  = tokenBreak(lastToken,  end   - lastToken.start,  found.last.span);
        
        var newValue = [].concat(
            firstTokens.second, 
            middleTokens, 
            lastTokens.first
        );
        newValue = tokenJoin(newValue);
        var newToken = tokenMake('html', newValue, start);
        
        tokens = [].concat(
            beforeTokens, 
            firstTokens.first, 
            newToken, 
            lastTokens.second, 
            afterTokens
        );
        var result = {
            tokens:   tokens,
            position: beforeTokens.length + firstTokens.first.length
        };
        return result;
    }
    
    /**
     * Applies all the filters of the given that to the given html
     * 
     * @param {Object} that
     * @param {String} html
     * 
     * @return String
     */
    function filtersProcess( that, html )
    {
        var result = html;
        if (! that.filters)
        {
            return result;
        }
        var tokens = [];
        for (var i = 0, iTop = that.filters.length; i < iTop; i++ )
        {
            var filter = that.filters[i];
            var callback = $.chili.filters && $.chili.filters[ filter.callback ];
            if (! (callback && $.isFunction(callback)))
            {
                continue;
            }
            if (0 == tokens.length)
            {
                tokens = tokenSplit(html);
            }
            var extraction = tokenExtract(tokens, filter.start, filter.count);
            tokens = extraction.tokens;
            var position = extraction.position;
            var filterInput = {
                text: filter.original,
                html: tokens[ position ].value
            };
            var args = filter.args;
            var filterOutput = callback.apply(filterInput, args);
            tokens[ position ].value = filterOutput;
        }
        if (0 < tokens.length)
        {
            result = tokenJoin(tokens);
        }
        return result;
    }
    
        
    /**
     * Clears anything that was selected before
     */
    function clearPreviousSelection()
    {
        if ($.browser.msie) 
        {
            document.selection.empty();
        }
        else
        {
            window.getSelection().removeAllRanges();
        }
    }
    
    /**
     * Resets the currently selected element
     * 
     * This is later used to check that the user selected text from
     * the same element
     */
    function resetSelectedTextElement() 
    {
        element = this;
        clearPreviousSelection();
    }
    
    /**
     * Returns the text selected by the user
     */
    function getSelectedText()
    {
        var result;
        if ($.browser.msie)
        {
            result = document.selection.createRange().htmlText;
        }
        else
        {
            var selection = window.getSelection();
            var range     = selection.getRangeAt(0);
            selection = selection.toString();
            range     = range.toString();
            //selection works for line numbers on, range otherwise
            result = /\n/.test(selection) ? selection : range;
        }
        return result;
    }
    
    /**
     * Returns the given html after replacing any HTML break and block by a 
     * new line
     *
     * @param {String} html
     * 
     * @return String 
     */
    function preserveNewLines( html )
    {
        var newline_flag = unique(html);
        var text = '';
        if (/<br\b/i.test(html) || /<li\b/i.test(html)) 
        {
            if (/<br\b/i.test(html)) 
            {
                html = html.replace( /\<br[^>]*?\>/ig, newline_flag );
            }
            else if (/<li\b/i.test(html)) 
            {
                html = html.replace( /<ol[^>]*?>|<\/ol>|<li[^>]*?>/ig, '' ).replace( /<\/li>/ig, newline_flag );
            }
            var el = $( '<pre>' ).appendTo( 'body' ).hide()[0];
            el.innerHTML = html;
            text = $( el ).text().replace( new RegExp( newline_flag, "g" ), '\r\n' );
            $( el ).remove();
        }
        return text;
    }
    
    /**
     * Returns the given text, after removing garbage characters
     */
    function cleanText( text )
    {
        var result = $.browser.msie
            ? preserveNewLines(text)
            : text
                .replace( /\r/g, '' )
                .replace( /^# ?/g, '' )
                .replace( /\n# ?/g, '\n' );
        return result;
    }
    
    /**
     * Shows a dialog containing the given text
     */
    function makeDialog( selected, event )
    {
        var boxOptions = $.chili.selection.box;
        var boxTag = $.browser.msie
            ? ('<textarea style="' + boxOptions.style + '">')
            : ('<pre style="' + boxOptions.style + '">');
            
        var boxElement = $(boxTag)
            .appendTo( 'body' )
            .text( selected )
            .attr( 'id', 'chili_selection' )
            .click( function() { $(this).remove(); } )
        ;
        var top  = boxOptions.top(event.pageX, event.pageY, 
                boxElement.width(), boxElement.height());
        var left = boxOptions.left(event.pageX, event.pageY, 
                boxElement.width(), boxElement.height());
        boxElement.css( { top: top, left: left } );
            
        return boxElement;
    }
    
    /**
     * Selects the text in the given $container
     */
    function selectTextAgain($container)
    {
        if ($.browser.msie) 
        {
            $container[0].focus();
            $container[0].select();
        }
        else 
        {
            var s = window.getSelection();
            s.removeAllRanges();
            var r = document.createRange();
            r.selectNodeContents( $container[0] );
            s.addRange( r );
        }
    }
    
    /**
     * Shows a dialog containing the text selected by the user
     */
    function displaySelectedTextDialog( event ) 
    {
        if (! (element && element == this)) 
        {
            return;
        }
        element = null;
        
        var selectedText = getSelectedText();
        if ( '' == selectedText ) 
        { 
            return;
        }
        selectedText = cleanText(selectedText);
        
        var $container = makeDialog(selectedText, event);
        selectTextAgain($container);
    }
    
    /**
     * When a user selects highlighted text, IE and FF returns a mess: this
     * function displays a minimal dialog with the selected text, cleaned up 
     */
    function fixTextSelection( dom_element )
    {
        //chrome, opera, and safari select PRE text correctly 
        if ($.chili.selection.active && ($.browser.msie || $.browser.mozilla)) 
        {
            var element = null;
            $(dom_element)
                .parents()
                .filter("pre")
                .bind("mousedown", resetSelectedTextElement)
                .bind("mouseup", displaySelectedTextDialog)
            ;
        }
    }
    
    }
)(jQuery);
