function update_output(source, output) {
  var error_offsets = new Array();
  var error_lookaheads = new Array();
  var error_count = 0;
  var str = document.getElementById(source).value;
  document.getElementById(output).innerHTML = "Initiating parse...";
  resetState();
  var ret = __parse( str, error_offsets, error_lookaheads );
  if( ret > 0 ) {
    var errstr = new String();
    for( var i = 0; i < error_count; i++ ) errstr += "Parse error in line " + ( str.substr( 0, error_offsets[i] ).match( /\n/g ) ? str.substr( 0, error_offsets[i] ).match( /\n/g ).length : 1 ) + " near \"" + str.substr( error_offsets[i] ) + "\", expecting \"" + error_lookaheads[i].join() + "\"\n";
    document.getElementById(output).innerHTML = "You have a mistake in your code! Found " + error_count + " errors :(:\n" + errstr;
  } else {
    var parseoutput = flat_tree_walker_ul(gTemp);
    document.getElementById(output).innerHTML = parseoutput.html;
    align_submenus(parseoutput.tli, parseoutput.levelpcs);
  }
}

function makeNav(dest, str) {
  var ret = __parse( str, new Array(), new Array() );
  if (ret != 0) return;
  var parseoutput = flat_tree_walker_ul(gTemp);
  document.getElementById(dest).innerHTML = parseoutput.html;
  align_submenus(parseoutput.tli, parseoutput.levelpcs);
}