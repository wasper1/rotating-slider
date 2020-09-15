# rotating-slider

Rotating slider for selecting numerical values.
Allows mobile friendly precise selection for value from selected range with desired step.
Component is especially useful for hybrid application using frameworks like Ionic, Cordova or PhoneGap.

## Demo
Live demo is available [here](https://wasper1.github.io/rotating-slider/)

Production usage [example](https://play.google.com/store/apps/details?id=eu.lifemonitor&hl=en)
## Install
`npm install rotating-slider`

## Usage
HTML
```
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://wasper1.github.io/rotating-slider/src/rotating-slider.css">
</head>
<body>
    <div>
        Integers
        <h1 id="rotating-slider1"/>
    </div>
    <div>
        Decimal numbers
        <h1 style="width: 50%; margin: auto;" id="rotating-slider2"/>
    </div>
</body>
</html>
```

js
```
import RotatingSlider from 'rotating-slider';

RotatingSlider("#rotating-slider1", {min: 1, max: 100, step: 1}, 10)
    .setChangeCallback(val => {console.log(val);});
            
RotatingSlider("#rotating-slider1", {min: 1, max: 5, step: 0.5}, 3.5)
    .setChangeCallback(val => {console.log(val);});

```

## License
This project is available under the [MIT](https://opensource.org/licenses/mit-license.php) license.
