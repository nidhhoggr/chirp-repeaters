# Chirp-Repeaters
  A tool to extract a list of repeaters from RepeaterBook into a Chirp import file

## Author: Joseph Persie

### Usage:
  State and a Band without a filter:
```
    CACHE=1 ./chirp-repeaters ID 2m
```
  A State, Band, County and City:
```
    CACHE=1 ./chirp-repeaters ID 2m '[{"counties":["Bonner"]},{"cities":["Sandpoint"]}]'
```
  Using multiple filters using subset exclusivity: (all cities must belong to the counties specified)
```
    CACHE=1 ./chirp-repeaters ID 2m '[{"counties":["Bonner","Kootenai"]},{"cities":["Sandpoint","Athol"]}]'
```
  Joining results of multiple filters without subset exclusivity: (filters are not mutual)
```
    CACHE=1 ./chirp-repeaters ID,MT 2m,70cm '{"cities": ["Sandpoint","Kalispell"], "counties": ["Kootenai"]}'
```

### Environment Variables:
  * `CACHE`: whether or not to use the cached results
  * `DEBUG`: set debug verbosity (default: 1), set to 0 to disable
