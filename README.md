# TrueTemp

A small, dependency-free oven temperature converter calibrated to these measured points:

| True temperature | Oven setting |
| ---: | ---: |
| 250°F | 300°F |
| 350°F | 425°F |
| 375°F | 430°F |
| 400°F | 470°F |

Open `index.html` directly in a browser, or serve this directory with any static web server.

Temperatures between measured points use piecewise linear interpolation. Values outside the
250–400°F calibrated range are extrapolated and clearly marked as estimates.
