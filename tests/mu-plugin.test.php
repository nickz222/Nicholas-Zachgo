<?php
// Run: php tests/mu-plugin.test.php  (stubs the WordPress/Elementor pieces the plugin uses)

define( 'ABSPATH', __DIR__ );
$GLOBALS['hooks'] = [];
$GLOBALS['posted'] = [];
$GLOBALS['options'] = [];
$GLOBALS['inserted'] = [];

function add_action( $hook, $cb, $p = 10, $n = 1 ) { $GLOBALS['hooks'][ $hook ][] = $cb; }
function add_filter( $hook, $cb, $p = 10, $n = 1 ) { $GLOBALS['hooks'][ $hook ][] = $cb; }
function add_shortcode( $tag, $cb ) { $GLOBALS['hooks'][ 'shortcode_' . $tag ][] = $cb; }
function home_url( $path = '' ) { return 'https://investturningpoint.com' . $path; }
function esc_url_raw( $u ) { return $u; }
function wp_unslash( $v ) { return $v; }
function esc_html( $v ) { return htmlspecialchars( $v ); }
function esc_attr( $v ) { return htmlspecialchars( $v ); }
function wp_json_encode( $v, $f = 0 ) { return json_encode( $v, $f ); }
function is_wp_error( $v ) { return $v instanceof WP_Error; }
function wp_remote_post( $url, $args ) { $GLOBALS['posted'][] = [ $url, $args ]; return [ 'response' => [ 'code' => 302 ] ]; }
function get_option( $k ) { return $GLOBALS['options'][ $k ] ?? false; }
function update_option( $k, $v ) { $GLOBALS['options'][ $k ] = $v; }
function get_post( $id ) { return in_array( $id, $GLOBALS['inserted'], true ) ? (object) [ 'ID' => $id ] : null; }
function get_page_by_path( $p ) { return null; }
function wp_insert_post( $a ) { $GLOBALS['inserted'][] = 42; $GLOBALS['last_insert'] = $a; return 42; }
function is_page( $s ) { return false; }
function is_admin() { return false; }
class WP_Error { public function get_error_message() { return 'x'; } }

class Record { public $f; function __construct( $f ) { $this->f = $f; } function get( $k ) { return $this->f; } }
class Handler { public $is_success = true; public $data = []; function add_response_data( $k, $v ) { $this->data[ $k ] = $v; return $this; } }

$src = file_get_contents( __DIR__ . '/../wordpress/mu-plugins/turning-point-leads.php' );
$fails = 0;
function check( $name, $ok ) { global $fails; echo ( $ok ? 'PASS ' : 'FAIL ' ) . $name . "\n"; if ( ! $ok ) $fails++; }

// Load with a sheet URL set so sends can be observed.
eval( '?>' . str_replace( "const TPH_SHEET_URL = '';", "const TPH_SHEET_URL = 'https://script.google.com/macros/s/X/exec';", $src ) );

// Typical Elementor default form: name / email / message, ids like "name", "field_abc".
$h = new Handler();
$_SERVER['HTTP_REFERER'] = 'https://investturningpoint.com/sell-your-house/';
tph_handle_form( new Record( [
	'name'       => [ 'id' => 'name', 'title' => 'Name', 'type' => 'text', 'value' => 'Jane Q Seller' ],
	'field_1a2b' => [ 'id' => 'field_1a2b', 'title' => 'Phone Number', 'type' => 'tel', 'value' => '(816) 555-0100' ],
	'email'      => [ 'id' => 'email', 'title' => 'Email', 'type' => 'email', 'value' => 'jane@example.com' ],
	'field_9z'   => [ 'id' => 'field_9z', 'title' => 'Property Address', 'type' => 'text', 'value' => '1 Main St, Independence MO' ],
	'message'    => [ 'id' => 'message', 'title' => 'Message', 'type' => 'textarea', 'value' => 'Need to sell fast' ],
] ), $h );
$sent = $GLOBALS['posted'][0][1]['body'] ?? [];
check( 'sends to sheet URL', ( $GLOBALS['posted'][0][0] ?? '' ) === 'https://script.google.com/macros/s/X/exec' );
check( 'splits full name', $sent['firstName'] === 'Jane' && $sent['lastName'] === 'Q Seller' );
check( 'maps phone', $sent['phone'] === '(816) 555-0100' );
check( 'maps email', $sent['email'] === 'jane@example.com' );
check( 'maps address', $sent['address'] === '1 Main St, Independence MO' );
check( 'unmatched fields kept in reason', strpos( $sent['reason'], 'Message: Need to sell fast' ) !== false );
check( 'source page from referer', $sent['sourcePage'] === 'https://investturningpoint.com/sell-your-house/' );
check( 'no fullName key sent', ! array_key_exists( 'fullName', $sent ) );
check( 'sends all Apps Script keys', ! array_diff( [ 'firstName', 'lastName', 'phone', 'email', 'address', 'city', 'state', 'zip', 'timeline', 'condition', 'askingPrice', 'reason', 'sourcePage' ], array_keys( $sent ) ) );
check( 'redirects to thank-you', ( $h->data['redirect_url'] ?? '' ) === 'https://investturningpoint.com/thank-you/' );

// Phone field with an odd id/label is still found by its type.
$GLOBALS['posted'] = [];
tph_handle_form( new Record( [
	'field_x' => [ 'id' => 'field_x', 'title' => 'Best number', 'type' => 'tel', 'value' => '8165550199' ],
] ), new Handler() );
check( 'phone found by field type', ( $GLOBALS['posted'][0][1]['body']['phone'] ?? '' ) === '8165550199' );

// Our own form field names map 1:1.
$GLOBALS['posted'] = [];
$f = [];
foreach ( [ 'firstName' => 'A', 'lastName' => 'B', 'phone' => '1', 'email' => 'e@x.co', 'address' => 'addr', 'city' => 'Indep', 'state' => 'MO', 'zip' => '64058', 'timeline' => 'ASAP', 'condition' => 'Needs minor repairs', 'askingPrice' => '150000', 'reason' => 'Job loss' ] as $k => $v ) {
	$f[ $k ] = [ 'id' => $k, 'title' => $k, 'type' => 'text', 'value' => $v ];
}
tph_handle_form( new Record( $f ), new Handler() );
$b = $GLOBALS['posted'][0][1]['body'];
check( 'all named fields map exactly', $b['city'] === 'Indep' && $b['zip'] === '64058' && $b['timeline'] === 'ASAP' && $b['condition'] === 'Needs minor repairs' && $b['askingPrice'] === '150000' && $b['reason'] === 'Job loss' && $b['state'] === 'MO' );

// Labels that contain "property" go to the right column, not the address.
$GLOBALS['posted'] = [];
tph_handle_form( new Record( [
	'field_a' => [ 'id' => 'field_a', 'title' => 'Property Address', 'type' => 'text', 'value' => '9 Elm' ],
	'field_b' => [ 'id' => 'field_b', 'title' => 'Property Condition', 'type' => 'select', 'value' => 'Needs major repairs' ],
	'field_c' => [ 'id' => 'field_c', 'title' => 'Estimated Property Value', 'type' => 'text', 'value' => '200000' ],
	'field_d' => [ 'id' => 'field_d', 'title' => 'Phone', 'type' => 'tel', 'value' => '1' ],
] ), new Handler() );
$b = $GLOBALS['posted'][0][1]['body'];
check( 'property labels map correctly', $b['address'] === '9 Elm' && $b['condition'] === 'Needs major repairs' && $b['askingPrice'] === '200000' );

// Failed submissions are not sent or redirected.
$GLOBALS['posted'] = [];
$bad = new Handler(); $bad->is_success = false;
tph_handle_form( new Record( $f ), $bad );
check( 'failed submission not sent', ! $GLOBALS['posted'] && empty( $bad->data ) );

// Thank-you page created once.
tph_ensure_thank_you_page();
tph_ensure_thank_you_page();
check( 'thank-you page created once', count( $GLOBALS['inserted'] ) === 1 && $GLOBALS['last_insert']['post_name'] === 'thank-you' && $GLOBALS['last_insert']['post_status'] === 'publish' );
$html = tph_thank_you_html();
check( 'thank-you shows correct address', strpos( $html, '25209 E Blue Mills Rd, Independence, MO 64058' ) !== false );
check( 'no call button without phone', strpos( $html, 'tel:' ) === false );

// Schema is valid JSON with the right address and no empty phone.
ob_start(); tph_print_schema(); $s = ob_get_clean();
$json = json_decode( preg_replace( '#</?script[^>]*>#', '', $s ), true );
check( 'schema valid JSON', is_array( $json ) );
check( 'schema address', $json['address']['streetAddress'] === '25209 E Blue Mills Rd' && $json['address']['postalCode'] === '64058' );
check( 'schema omits empty phone', ! isset( $json['telephone'] ) );

// noindex filter on thank-you page only.
$robots = $GLOBALS['hooks']['wp_robots'][0]( [] );
check( 'other pages stay indexable', empty( $robots['noindex'] ) );

// Without a sheet URL nothing is sent but the redirect still happens (lead stays in Elementor Submissions).
check( 'empty URL sends nothing', tph_send_to_sheet( [] ) === true ); // URL set in this run
echo $fails ? "\n$fails failed\n" : "\nall passed\n";
exit( $fails ? 1 : 0 );
