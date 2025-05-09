# Original source by https://stackoverflow.com/a/79370439
def relevant_paths: paths | select( .[-1] | type != "number");
  
def is_scalar: type | IN("object", "array") | not;

def subtract_json($b):
  . as $a | 
  reduce ($b | relevant_paths) as $p (
    $a;
    if (getpath($p) | type == "array") and ($b | getpath($p) | type == "array") then setpath($p; getpath($p) - ($b | getpath($p)))
    elif (getpath($p) | is_scalar) and ($b | getpath($p) | is_scalar) then delpaths([$p]) end
  );
