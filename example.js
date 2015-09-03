var Pinentry = require("./");

var pinentry = new Pinentry();
pinentry.on("error", function (e) {
	console.log("bad error", e);
});
pinentry.connect(function (err) {
	if (err) {
		console.log("connect error", err);
	}
});
pinentry.getPin({
	desc: "Description",
	prompt: "Prompt"
}, function (err, pin) {
	if (err) {
		if (err instanceof Pinentry.OperationCancelledError)
			console.log("canceled");
		else
			console.error("error", err.toString());
		pinentry.close();
	} else
		pinentry.confirm({
			desc: "You typed: " + pin,
			prompt: "Confirm",
			ok: "Yes",
			cancel: "No",
			error: "Yes you did"
		}, function (err) {
			console.log(err ? "No" : "Yes");
			pinentry.close();
		});
});
