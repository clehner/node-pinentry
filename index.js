var inherits = require("util").inherits,
	spawn = require("child_process").spawn,
	EventEmitter = require("events").EventEmitter,
	Linerstream = require("linerstream");

function Pinentry() {
	this._cmdQueue = [];
	EventEmitter.call(this);
}
inherits(Pinentry, EventEmitter);

Pinentry.prototype._opt = {};

Pinentry.prototype._propCmds = {
	  desc: "SETDESC",
      prompt: "SETPROMPT",
      keyinfo: "SETKEYINFO",
      repeat: "SETREPEAT",
      repeaterror: "SETREPEATERROR",
      error: "SETERROR",
      ok: "SETOK",
      notok: "SETNOTOK",
      cancel: "SETCANCEL",
      qualitybar: "SETQUALITYBAR",
      qualitybar_tt: "SETQUALITYBAR_TT",
      title: "SETTITLE",
      timeout: "SETTIMEOUT"
};

Pinentry.prototype.connect = function (cmd, cb) {
	if (typeof cmd == "function") {
		cb = cmd;
		cmd = null;
	}
	if (cb) {
		this._onConnect = cb;
	}
    this._proc = spawn(cmd || "pinentry");
	this._proc.stdout.pipe(new Linerstream()).on("data",
		Pinentry_onLine.bind(this));
	return this;
};

Pinentry.prototype.close = function () {
	this._proc.stdin.end();
};

function Pinentry_handleResponse(err) {
	if (this._cb)
		this._cb(err, this._data);
	delete this._data;
	if (this._cmdQueue.length) {
		var cmd = this._cmdQueue.shift();
		Pinentry_handleCommand.call(this, cmd.cmd, cmd.opt, cmd.cb);
	} else {
		this._cmdInProgress = false;
	}
}

function Pinentry_onLine(line) {
	var i = line.indexOf(" ");
	var arg, resp;
	var err;
	if (i == -1) {
		resp = line;
	} else {
		resp = line.substr(0, i);
		arg = line.substr(i + 1);
	}

	if (!this._inited) {
		this._inited = true;
		if (resp != "OK")
			err = new PinentryError(arg);
		if (this._onConnect)
			this._onConnect(err);
		else if (err)
			this.emit("error", err);
		return;
	}

	var cmd = this._cmds.shift();
	switch (resp) {
		case "D":
			this._data = decodeURIComponent(arg);
			break;
		case "OK":
			if (this._cmds.length === 0)
				Pinentry_handleResponse.call(this, null);
			break;
		case "ERR":
			if (/ Operation cancelled /.test(arg))
				err = new PinentryOperationCancelledError(cmd + ": " + arg);
			else
				err = new PinentryError(cmd + ": " + arg);
			if (this._cmds.length > 0)
				this.emit("error", err);
			else
				Pinentry_handleResponse.call(this, err);
			break;
		default:
			console.log("unknown pinentry response to", cmd + ":", resp, arg);
	}
}

function Pinentry_handleCommand(cmd, opt, cb) {
	var lines = [];
	var cmds = [];
	for (var prop in this._propCmds) {
		if (opt[prop] != this._opt[prop]) {
			var cmdName = this._propCmds[prop];
			var args = opt[prop] ? (" " + encodeURIComponent(opt[prop])) : "";
			lines.push(cmdName + args);
			cmds.push(cmdName);
		}
	}

	lines.push(cmd);
	lines.push("");
	var data = lines.join("\n");

	cmds.push(cmd);
	this._opt = opt;
	this._cb = cb;
	this._cmd = cmd;
	this._cmds = cmds;
	this._proc.stdin.write(data);
}

function Pinentry_queueCommand(name, opt, cb) {
	if (this._cmdInProgress) {
		this._cmdQueue.push({
			cmd: name,
			opt: opt,
			cb: cb
		});
	} else {
		this._cmdInProgress = true;
		Pinentry_handleCommand.call(this, name, opt, cb);
	}
	return this;
}

Pinentry.prototype.confirm = function (opt, cb) {
	return Pinentry_queueCommand.call(this, "CONFIRM", opt, cb);
};

Pinentry.prototype.message = function (opt, cb) {
	return Pinentry_queueCommand.call(this, "MESSAGE", opt, cb);
};

Pinentry.prototype.getPin = function (opt, cb) {
	return Pinentry_queueCommand.call(this, "GETPIN", opt, cb);
};

function PinentryError(msg) {
	this.message = msg;
}
inherits(PinentryError, Error);

function PinentryOperationCancelledError(msg) {
	this.message = msg;
}
inherits(PinentryOperationCancelledError, PinentryError);

module.exports = Pinentry;
module.exports.Error = PinentryError;
module.exports.OperationCancelledError = PinentryOperationCancelledError;
