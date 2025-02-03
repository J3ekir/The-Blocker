include "meld";
include "subtract_json";
import "manifest" as $manifest;
import "firefox" as $firefox;
import "chrome" as $chrome;

$manifest::manifest | first | 
meld($firefox::firefox | first) |
subtract_json($chrome::chrome | first)
