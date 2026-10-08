An API to react to a dump. Supports toggle behavior:
* If the user has not reacted yet, the reaction is added.
* If the user sends the same reaction they already have, the reaction is toggled off (removed).
* If the user sends a different reaction, the reaction is switched to the new one.

Recalculates the dump's hot score and reaction counts automatically.
