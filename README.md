# rotating-slider

Rotating slider for selecting numerical values.
Allows mobile friendly precise selection for value from selected range with desired step.

## Demo
Live demo is available [here](https://wasper1.github.io/rotating-slider/)

## Install
`npm install rotating-slider`

## Usage
```
<html>
<head>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script src="https://wasper1.github.io/rotating-slider/src/rotating-slider.js"></script>
    <link rel="stylesheet" href="https://wasper1.github.io/rotating-slider/src/rotating-slider.css">
</head>
<body>
    <div>
        Integers
        <h1 id="rotating-slider1"/>
    </div>
    <div>
        Decimal numbers
        <h1 id="rotating-slider2"/>
    </div>
    
    <script>
        RotatingSlider($("#rotating-slider1"), {min: 1, max: 100, step: 1}, 10).setChangeCallback(function (val) {
            console.log(val)
        });
        RotatingSlider($("#rotating-slider2"), {min: 1, max: 5, step: 0.5}, 3.5).setChangeCallback(function (val) {
            console.log(val)
        });
    </script>
</body>
</html>
```

## License
This project is available under the [MIT](https://opensource.org/licenses/mit-license.php) license.
