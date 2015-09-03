# node-pinentry

A library for running a GnuPG [pinentry][] process and communicating it with
the [Assuan][] client protocol.

[pinentry]: https://www.gnupg.org/related_software/pinentry/index.en.html
[Assuan]: http://www.gnupg.org/documentation/manuals/assuan/

## API

### Pinentry

A class for running pinentry programs.

Example:

```
var Pinentry = require("pinentry");
new Pinentry().connect().getPin({desc: "gimme pin"}, function (err, pin) {
	if (err) console.log("error");
	else console.log("got pin", pin);
	this.close();
});
```

For more detailed usage, see `example.js`.

#### new Pinentry()
Create a new pinentry object.

#### pinentry.connect([cmd], [callback])
Run the given pinentry command and connect to it. cmd defaults to "pinentry".
If a callback is provided, it is called when the connection is established,
with an error if there is an error. If a connection error occurs but there is
no callback, an error is event is emitted on the pinentry object instead.

#### pinentry.confirm(options, callback)
Prompt the user to confirm something. If user chooses OK, callback is called
with null arguments). If user chooses Cancel, callback is called with a
PinentryOperationCancelledError object.

#### pinentry.message(options, callback)
Show a message to the user.

#### pinentry.getPin(options, callback)
Ask the user to enter a pin. The callback is called with an error object if
there is an error, and a pin if the user enters a pin.

#### Event: 'error'
Emitted on error response for setting properties. Note that an error for a
confirm/message/getPin call itself is put in the callback instead of an event.

#### Options

Use these parameters for the `confirm`, `message`, and `getPin` methods.

 - `desc`: Description text
 - `prompt`: Heading text
 - `title`: Window title text
 - `ok`: OK button text
 - `cancel`: Cancel button text
 - `error`: Additional text

Other options (unknown use or not working):
`keyinfo`, `repeat`, `repeaterror`, `notok`, `timeout`, `qualitybar`,
`qualitybar_tt`

### PinentryOperationCancelledError

`Pinentry.OperationCancelledError`

Error object returned to callbacks when user cancels a prompt.

### PinentryError

`Pinentry.Error`

Generic error object returned to callbacks.

## License

Fair License (Fair)

© 2015 Charles Lehner

Usage of the works is permitted provided that this instrument is retained with
the works, so that any entity that uses the works is notified of this
instrument.

DISCLAIMER: THE WORKS ARE WITHOUT WARRANTY.
