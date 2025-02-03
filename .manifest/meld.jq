# Original source by https://stackoverflow.com/a/53666584
# Improved with suggestions by https://github.com/emanuele6 from the jq Discord server
def meld($b):
  . as $a |
  if all($a, $b; type == "object") then reduce ($a + $b | keys_unsorted[]) as $k ({}; .[$k] = ($a[$k] | meld($b[$k])))
  elif all($a, $b; type == "array") then ($a + $b | unique)
  elif $b == null then $a
  else $b end;
