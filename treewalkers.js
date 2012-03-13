var _nextNum = 0
function uniqueIdentifier() {
    return 'f' + ++_nextNum;
}

function resetState() {
  timeouts = {};
  parchild = {};
  levelpcs = new Array();
}
var timeouts = {};
var parchild = {};
var levelpcs = new Array();

function didreallymouseout(e, layer) {
  var x = e.clientX;
  var y = e.clientY;
  var brec = layer.getBoundingClientRect();
  if (x < brec.left || x > brec.right || y < brec.top || y > brec.bottom) {
    window[layer.id + '_inside'] = false;
    registerTimeout(setTimeout(function() { document.getElementById(layer.id).style.display='none'; }, 50), parchild[layer.id]);
  }
}

function registerTimeout(toid, parentid) {
  var items = timeouts[parentid];
  if (items) {
    items.push(toid);
  } else timeouts[parentid] = [toid];
}

function setparchildForLevel(level, child, parent) {
  if (!levelpcs[level]) levelpcs[level] = {}
  levelpcs[level][child] = parent;
  parchild[child] = parent;
}

function flat_tree_walker_ul(tree) {
  // tree is an array of arrays
  // elements are either "format"s or "item"s
  var prevlevel = 0;
  var ret = "";
  var claz = new Array();
  var newSS = document.createElement('style');
  newSS.type = "text/css"
  document.getElementsByTagName('head')[0].appendChild(newSS)
  var ss = document.styleSheets[document.styleSheets.length-1];
  var levels = new Array();
  var formats = new Array();
  var overrides = new Array();
  var markers = {};
  var horizontal = true;
  var ulclass = uniqueIdentifier();
  var DIRECTION_SAME = 0;
  var DIRECTION_UP = 1;
  var DIRECTION_DOWN = 2;
  var DIRECTION_LEFT = 3;
  var DIRECTION_RIGHT = 4;
  var direction = DIRECTION_SAME;
  var horizontalities = new Array();
  var directions = new Array();
  var widths = new Array();
  var divprefix = uniqueIdentifier();
  var divclaz = new Array();
  
  var toplevelid = '';
    
  var fauxtree = new Array();
  /// elements are objects. fields:
  ///////// type = open | text | close
  ////////  tagname for open/close only
  ////////  attrs for open only
  ///////// content for text only
  var OPEN = 'open';
  var TEXT = 'text';
  var CLOSE = 'close';
  
  fauxtree.push({ type: OPEN, tagname: 'div', attrs: { position: 'relative' } });

  function raiseLevels(level, initformats) {
    while (level > prevlevel) {
      var dz = divclaz[prevlevel+1];
      var dattrs = {};
      dattrs['class'] = dz;
      if (dz) {
        dattrs.id = uniqueIdentifier();
        if (level == 1) toplevelid = dattrs.id;
        else {
          dattrs.onmouseover = 'window[\'' + dattrs.id + '_inside\'] = true;';
          dattrs.onmouseout = 'didreallymouseout(event, this)';
        }
        if (directions[level] == DIRECTION_UP) dattrs._orientation = ['above'];
        else if (directions[level] == DIRECTION_DOWN) dattrs._orientation = ['below'];
        
        fauxtree.push({ type: OPEN, tagname: 'div', attrs: dattrs });
        if (level != 1) {
          // our parent will always be fauxtree.length-6 if no one is messing with us
          var parentattrs = fauxtree[fauxtree.length-6].attrs;
          parentattrs.onmouseout = 'var omout = function() { if (!window[\'' + dattrs.id + '_inside\']) { document.getElementById(\'' + dattrs.id + '\').style.display = \'none\'; }}; setTimeout(omout, 50);';
          var plevel = level-1;
          parentattrs.onmouseover = 'align_submenu(\'' + toplevelid + '\', \'' + dattrs.id + '\', ' + plevel + '); var tos = timeouts[this.id]; timeouts[this.id] = new Array(); if (tos) { for (var i=0; i<tos.length; i++) clearTimeout(tos[i]); } document.getElementById(\'' + dattrs.id + '\').style.display = \'block\'';
          parentattrs.id = uniqueIdentifier();
          setparchildForLevel(level, dattrs.id, parentattrs.id);
        }
      }
      var ulattrs = {};
      if (direction == DIRECTION_SAME && level != 1) ulattrs.style='padding-left: 1em;';
      ulattrs['class'] = ulclass;
      if (level == 1 && !dz) { ulattrs.id = uniqueIdentifier(); toplevelid = ulattrs.id; }
      fauxtree.push({ type: OPEN,  tagname: 'ul', attrs: ulattrs });
      var levelclaz = levels[++prevlevel];
      if (!levelclaz) {
        levels[prevlevel] = uniqueIdentifier();
        levelclaz = levels[prevlevel];
      }
      claz.push(levelclaz);
      if (initformats) formats[prevlevel] = true;
    }
  }
  
  function ulCSS() { 
    //   min-width: 15em; text-align: left;
    cssdec = 'margin: 0px auto; padding: 0px; list-style: none; white-space: nowrap;';
    insertRule('.' + ulclass, cssdec, 0);
  }
  
  function markerForClaz() {
    for (var i = claz.length-1; i >= 0; i--) {
      var marker = markers[claz[i]];
      if (marker)
        if (marker == 'none') return '';
        else return marker;
    }
    return '';
  }
  
  function updateHorizontality(level) {
    horizontal = horizontalities[level];
  }
  
  function setHorizontality(horiz, level) {
    horizontalities[level] = horiz;
    horizontal = horiz;
  }
  
  function setDirection(dir, level) {
    direction = dir;
    directions[level] = dir;
    // by default, all changes of direction imply vertical submenus. this can be overriden with the layout: directive.
    // direction: same; inherits from its parent
    if (dir == DIRECTION_SAME) setHorizontality(horizontalities[level-1], level);
    else setHorizontality(false, level);
  }

  function addCSSclass(clz, attrs, top) {
        var selector = '.' + clz;
        var desc = '';
        for (var prop in attrs) {
          desc += prop + ": " + attrs[prop].join(" ") + ";\n";
        }
        var index = ss.rules.length;
        if (ss.cssRules) index = ss.cssRules.length;
        if (top) index = 0;
        insertRule(selector, desc, index);
  }
  
  function insertRule(selector, description, index) {
    // IE BLOWS, WE NEED TO USE ADDRULE() HERE INSTEAD FOR IT
    if (ss.insertRule) ss.insertRule(selector + ' { ' + description + ' }', index);
    else ss.addRule(selector, description);
  }
      
  for (var i = 0; i< tree.length; i++) {
    if (tree[i][0] == 'format') {
      var lastformat = tree[i][1];
      var needsBaseLiStyling = false;
      if (prevlevel == 0) {
        needsBaseLiStyling = true;
        ulCSS();
      }
      
      var level = tree[i+1][1];
      if (level == prevlevel) return "Malformed input: format declaration found mid-level";
      if (lastformat.direction) {
        var dir = lastformat.direction;
        if (dir == 'above') dir = DIRECTION_UP;
        else if (dir == 'below') dir = DIRECTION_DOWN;
        else if (dir == 'left') dir = DIRECTION_LEFT;
        else if (dir == 'right') dir = DIRECTION_RIGHT;
        else dir = DIRECTION_SAME;
        
        setDirection(dir, level);
        if (lastformat.layout == 'horizontal') setHorizontality(true, level);
      }
      
      function divCSS(width, bg) {
        var clz = divclaz[level];
        if (!clz) {
          var attrs = {};
          divclaz[level] = divprefix + uniqueIdentifier();
          clz = divclaz[level];
          attrs.position = ['absolute'];
          widths[level] = width;
          if (level == 1) attrs.position = ['relative'];
          else {
            if (directions[level] == DIRECTION_LEFT || directions[level] == DIRECTION_RIGHT) {
              var offset = 0;
              var unit = 'px';
              var lw = widths[level-1];
              var match = new RegExp('(\\d+)(\\w+)').exec(lw);
              offset += parseInt(match[1]);
              unit = match[2];
            }
            if (directions[level] == DIRECTION_LEFT) attrs.right = [offset + unit];
            else if (directions[level] == DIRECTION_RIGHT) attrs.left = [offset + unit];
            attrs.display = ['none'];
          }
          attrs.width = [width];
          if (bg) attrs.background = bg;
          addCSSclass(clz, attrs, true);
        }
      }
      
      var width = lastformat['layout-width'];
      if (lastformat.layout == 'vertical') {
        setHorizontality(false, level);
      } else if (horizontalities[level] === false) {
        updateHorizontality(level);
      } else setHorizontality(true, level);
      if (!horizontal && (direction != DIRECTION_SAME || level == 1)) divCSS(width, lastformat.background);
      
      raiseLevels(level, false);
      
      if (needsBaseLiStyling) {
        var directioncss = "display: inline;";
        if (!horizontal) directioncss = "display: block;";
        var cssdec =  directioncss + " margin: 0px; padding: 0px;";
        insertRule('.' + claz[0], cssdec, 0);
        // now set some sane defaults for the links/text so they don't look like crap
        cssdec = "font-family: sans-serif; text-decoration: none; padding: 0.5em 1em; background: yellow;";
        insertRule("." + claz[0] + " a , " + "." + claz[0] + " span", cssdec, 1);
        // and now for hover attrs
        cssdec = "text-decoration: underline; background: white;";
        insertRule("." + claz[0] + " a:hover , " + "." + claz[0] + " span:hover", cssdec, 2);
      }
      
      if (formats[level]) {
          overrides[level] = true;
          var uidf = uniqueIdentifier();
          claz.push(uidf);
      } else { formats[level] = true; }
      
      var clazselector = "." + claz[claz.length-1];
      
      if (lastformat.hover) {
        var selector = clazselector + " a:hover , " + clazselector + " span:hover";
        var description = '';
        var hoverprops = lastformat.hover;
        for (var prop in lastformat.hover) {
          description += prop + ": " + hoverprops[prop].join(" ") + ";\n";
        }
        var index = ss.rules.length;
        if (ss.cssRules) index = ss.cssRules.length;
        insertRule(selector, description, index);
      }
      
      if (lastformat.marker) {
        var marker = lastformat.marker;
        var sym = '';
        if (marker == 'dot') sym = '&#183; ';
        else if (marker == 'none') sym = 'none';
        else sym = marker + ' ';
        markers[claz[claz.length-1]] = sym;
      }
      if (lastformat["element-style"] == 'rounded-tab') {
         lastformat["border-radius-topleft"         ] = ['7px'];
         lastformat["-o-border-radius-topleft"      ] = ['7px'];
         lastformat["-icab-border-radius-topleft"   ] = ['7px'];
         lastformat["-khtml-border-radius-topleft"  ] = ['7px'];
         lastformat["-moz-border-radius-topleft"    ] = ['7px'];
         lastformat["-webkit-border-radius-topleft" ] = ['7px'];
         lastformat["border-top-left-radius"        ] = ['15px'];
         lastformat["-o-border-top-left-radius"     ] = ['15px'];
         lastformat["-icab-border-top-left-radius"  ] = ['15px'];
         lastformat["-khtml-border-top-left-radius" ] = ['15px'];
         lastformat["-moz-border-top-left-radius"   ] = ['15px'];
         lastformat["-webkit-border-top-left-radius"] = ['15px'];
         lastformat["border-radius-topright"         ] = ['7px'];
         lastformat["-o-border-radius-topright"      ] = ['7px'];
         lastformat["-icab-border-radius-topright"   ] = ['7px'];
         lastformat["-khtml-border-radius-topright"  ] = ['7px'];
         lastformat["-moz-border-radius-topright"    ] = ['7px'];
         lastformat["-webkit-border-radius-topright" ] = ['7px'];
         lastformat["border-top-right-radius"        ] = ['15px'];
         lastformat["-o-border-top-right-radius"     ] = ['15px'];
         lastformat["-icab-border-top-right-radius"  ] = ['15px'];
         lastformat["-khtml-border-top-right-radius" ] = ['15px'];
         lastformat["-moz-border-top-right-radius"   ] = ['15px'];
         lastformat["-webkit-border-top-right-radius"] = ['15px'];
      } else if (lastformat["element-style"] == 'regular') {
         lastformat["border-radius-topleft"          ] = ['0px'];
         lastformat["-o-border-radius-topleft"       ] = ['0px'];
         lastformat["-icab-border-radius-topleft"    ] = ['0px'];
         lastformat["-khtml-border-radius-topleft"   ] = ['0px'];
         lastformat["-moz-border-radius-topleft"     ] = ['0px'];
         lastformat["-webkit-border-radius-topleft"  ] = ['0px'];
         lastformat["border-top-left-radius"         ] = ['0px'];
         lastformat["-o-border-top-left-radius"      ] = ['0px'];
         lastformat["-icab-border-top-left-radius"   ] = ['0px'];
         lastformat["-khtml-border-top-left-radius"  ] = ['0px'];
         lastformat["-moz-border-top-left-radius"    ] = ['0px'];
         lastformat["-webkit-border-top-left-radius" ] = ['0px'];
         lastformat["border-radius-topright"         ] = ['0px'];
         lastformat["-o-border-radius-topright"      ] = ['0px'];
         lastformat["-icab-border-radius-topright"   ] = ['0px'];
         lastformat["-khtml-border-radius-topright"  ] = ['0px'];
         lastformat["-moz-border-radius-topright"    ] = ['0px'];
         lastformat["-webkit-border-radius-topright" ] = ['0px'];
         lastformat["border-top-right-radius"        ] = ['0px'];
         lastformat["-o-border-top-right-radius"     ] = ['0px'];
         lastformat["-icab-border-top-right-radius"  ] = ['0px'];
         lastformat["-khtml-border-top-right-radius" ] = ['0px'];
         lastformat["-moz-border-top-right-radius"   ] = ['0px'];
         lastformat["-webkit-border-top-right-radius"] = ['0px'];
      }
      
      // clean props before we pass them to CSS
      delete lastformat.hover;
      delete lastformat.layout;
      delete lastformat.direction;
      delete lastformat.marker;
      delete lastformat["layout-width"];
      delete lastformat["element-style"];
      // off we go to CSS wonderland!
      var selector = clazselector + " a , " + clazselector + " span";
      var description = '';
      for (var prop in lastformat) {
        description += prop + ": " + lastformat[prop].join(" ") + ";\n";
      }
      // if we're vertical, set these guys to block so they take up all available space (and do some other nice things for us)
      if (!horizontal) description += 'display: block; margin: 0px;';
      var index = ss.rules.length;
      if (ss.cssRules) index = ss.cssRules.length;
      insertRule(selector, description, index);      
    } else if (tree[i][0] == 'item') {
      var level = tree[i][1];
      var text = tree[i][2];
      var href = tree[i][3];
      raiseLevels(level, true);
      for (; level < prevlevel; prevlevel--) {
        fauxtree.push({ type: CLOSE, tagname: 'ul' });
        if (horizontalities[prevlevel] === false) fauxtree.push({ type: CLOSE, tagname: 'div' });
        claz.pop();
        if (overrides[prevlevel]) {
          overrides[prevlevel] = false;
          claz.pop();
        }
      }
      updateHorizontality(level);
      
      text = markerForClaz() + text;
      var lattr = {};
      lattr['class'] = claz.join(" ");
      fauxtree.push({ type: OPEN, tagname: 'li', attrs: lattr });
      if (href) {
        fauxtree.push({ type: OPEN, tagname: 'a', attrs: { href: href } });
        fauxtree.push({ type: TEXT, content: text });
        fauxtree.push({ type: CLOSE, tagname: 'a' });
      } else {
        fauxtree.push({ type: OPEN, tagname: 'span'  });
        fauxtree.push({ type: TEXT, content: text });
        fauxtree.push({ type: CLOSE, tagname: 'span' });
      }
      fauxtree.push({ type: CLOSE, tagname: 'li' });
    } else {
      // someone's messin' with our data structures! abort!
      return;
    }
  }
  fauxtree.push({ type: CLOSE, tagname: 'ul' });
  if (!horizontal) fauxtree.push({ type: CLOSE, tagname: 'div' });
  fauxtree.push({ type: CLOSE, tagname: 'div' });
  
  // now walk this damn tree, lol
  for (var i = 0; i < fauxtree.length; i++) {
    var item = fauxtree[i];
    if (item.type == OPEN) {
      var attrstr = '';
      for (var attr in item.attrs)  attrstr += attr + '="' + item.attrs[attr] + '" ';
      
      ret += '<' + item.tagname + ' ' + attrstr + '>';
    } else if (item.type == CLOSE) ret += '</' + item.tagname + '>';
    else // assume it's text
      ret += item.content;
  }
  return { html: ret, tli: toplevelid, levelpcs: levelpcs };
}

function align_submenus(tli, levelpcs) {
  var root = document.getElementById(tli).getBoundingClientRect();
  var i = 2;
  var dic = levelpcs[i];
  for (var child in dic) {
    if (document.getElementById(child).getAttribute('_orientation') == 'above') {
      // above -> bottom of child = top of parent
      document.getElementById(child).bottom = document.getElementById(dic[child]).childNodes[0].getBoundingClientRect().top + 'px';
      // left = left of parent
      document.getElementById(child).left = document.getElementById(dic[child]).getBoundingClientRect().left + 'px';
    } else if (document.getElementById(child).getAttribute('_orientation') == 'below') {
      // below -> top of child = bottom of parent
      document.getElementById(child).style.top = document.getElementById(dic[child]).childNodes[0].getBoundingClientRect().bottom + 'px';
      // left = left of parent
      document.getElementById(child).style.left = document.getElementById(dic[child]).getBoundingClientRect().left + 'px';
    } else {
      var itemoffset = document.getElementById(dic[child]).getBoundingClientRect().top-root.top;
      document.getElementById(child).style.top = itemoffset + 'px';
    }
  }
}

// FIXME: these last two functions are nearly identical ... figure out how to combine them.
function align_submenu(tli, child, level) {
  if (level == 1) return;
  var root = document.getElementById(child).parentElement.getBoundingClientRect();
  var dic = levelpcs[level+1];
  if (document.getElementById(child).getBoundingClientRect().top == 0) {
    // let's unhide!
    if (document.getElementById(child).getAttribute('_orientation') == 'above') {
      // above -> bottom of child = top of parent
      document.getElementById(child).bottom = document.getElementById(dic[child]).childNodes[0].getBoundingClientRect().top + 'px';
      // left = left of parent
      document.getElementById(child).left = document.getElementById(dic[child]).getBoundingClientRect().left + 'px';
    } else if (document.getElementById(child).getAttribute('_orientation') == 'below') {
      // below -> top of child = bottom of parent
      document.getElementById(child).style.top = document.getElementById(dic[child]).childNodes[0].getBoundingClientRect().bottom + 'px';
      // left = left of parent
      document.getElementById(child).style.left = document.getElementById(dic[child]).getBoundingClientRect().left + 'px';
    } else {
      var itemoffset = document.getElementById(dic[child]).getBoundingClientRect().top-root.top;
      document.getElementById(child).style.top = itemoffset + 'px';
    }
  }
}