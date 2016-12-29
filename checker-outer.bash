function _checker-outer() {
  COMPREPLY=()
  local word="${COMP_WORDS[COMP_CWORD]}"

  if [ "$COMP_CWORD" -eq 1 ]; then

    local com=("${COMP_WORDS[1]}");
    local mod=("${COMP_WORDS[2]}");

    local completions="$(_checker-outer-autocomplete $mod)";

    COMPREPLY=($(compgen -W "$completions" -- "$word"));

    return
  fi



}

complete -F _checker-outer checker-outer
