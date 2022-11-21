# tplink

Service shim for linking tp-link to IFTTT.  Exposes IFTTT actions to turn on TPLink devices with automatic turn off after specified time.  I'm using this to turn on home hot water recirculation for 10 minutes based on motion sensors near faucets, saving water and electricity.  

TODO

- deal with rate limit problem
- cache device list
- also cache last time turned on for each device; if within time limit (start with 3 min) then don't turn on
