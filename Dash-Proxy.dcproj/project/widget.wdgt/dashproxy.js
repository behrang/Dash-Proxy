(function () {
    "use strict";
    var nsCommand = "/usr/sbin/networksetup";

    function getSelectedNetworkService() {
        var nsPopup, value;
        nsPopup = document.getElementById("nsPopup");
        value = nsPopup.object.getValue();
        if (value === "*") {
            value = null;
        }
        return value;
    }

    function setSelectedNetworkService(ns) {
        var nsPopup, options, i, len;
        nsPopup = document.getElementById("nsPopup");
        options = nsPopup.object.select.options;
        for (i = 0, len = options.length; i < len; i += 1) {
            if (options[i].value === ns) {
                nsPopup.object.setSelectedIndex(i);
                break;
            }
        }
    }

    function parseCommandOutput(output) {
        var list, i, len, entry, result;
        result = {};
        list = output.trim().split("\n");
        for (i = 0, len = list.length; i < len; i += 1) {
            entry = list[i].split(":");
            result[entry[0]] = entry[1].trim();
        }
        return result;
    }

    function isButtonPressed(buttonId) {
        var button = document.getElementById(buttonId);
        return (button.className.indexOf("pressed") >= 0);
    }

    function setButtonPressed(buttonId, pressed) {
        var button = document.getElementById(buttonId);
        if (pressed && !isButtonPressed(buttonId)) {
            button.className += " pressed";
        } else if (!pressed) {
            button.className = button.className.replace(/(?:^|\s)pressed(?!\S)/, "");
        }
    }

    function updateState(buttonId) {
        var networkService, getCommand;
        networkService = getSelectedNetworkService();
        if (networkService) {
            getCommand = nsCommand + " -get" + buttonId + "proxy '" + networkService + "'";
            if (buttonId === "auto") {
                getCommand = nsCommand + " -getautoproxyurl '" + networkService + "'";
            }
            widget.system(getCommand, function (o) {
                var enabled = parseCommandOutput(o.outputString).Enabled.toLowerCase() === "yes";
                setButtonPressed(buttonId, enabled);
            });
        }
    }

    function updateAllStates() {
        var nsPopup, nsActive;
        nsPopup = document.getElementById("nsPopup");
        nsActive = document.getElementById("nsActive");
        if (nsPopup.object.getValue() === "*") {
            nsActive.innerText = "First select a network service";
        } else {
            nsActive.innerText = nsPopup.object.getValue();
        }
        updateState("auto");
        updateState("web");
        updateState("secureweb");
        updateState("ftp");
        updateState("socksfirewall");
    }

    function loadNetworkServices(ns, cb) {
        widget.system(nsCommand + " -listallnetworkservices", function (o) {
            var nsArray, nsFiltered, nsPopup, i, element;
            nsPopup = document.getElementById("nsPopup");
            ns = ns || getSelectedNetworkService();
            nsArray = o.outputString.trim().split("\n");
            nsFiltered = [];
            nsFiltered.push(["", "*"]);
            for (i = 0; i < nsArray.length; i += 1) {
                element = nsArray[i];
                if (element.indexOf("*") === -1) {
                    nsFiltered.push([element, element]);
                }
            }
            nsPopup.object.setOptions(nsFiltered);
            setSelectedNetworkService(ns);
            if (cb) {
                cb();
            }
        });
    }

    function toggleProxy(buttonId) {
        var networkService, setCommand, pressed;
        networkService = getSelectedNetworkService();
        if (networkService) {
            pressed = isButtonPressed(buttonId);
            setCommand = nsCommand + " -set" + buttonId + "proxystate '" + networkService + "' " + (pressed ? "off" : "on");
            widget.system(setCommand, function () {
                updateState(buttonId);
            });
        }
    }

    function changeHandler(event) {
        widget.setPreferenceForKey(event.target.value, dashcode.createInstancePreferenceKey("network-service"));
    }

    function clickHandler(event) {
        var ns = getSelectedNetworkService();
        if (ns) {
            toggleProxy(event.target.parentNode.id);
        } else {
            window.showBack();
        }
    }

    function loadCompleted() {
        var nsPopup, i, buttons = ["auto", "web", "secureweb", "ftp", "socksfirewall"];

        nsPopup = document.getElementById("nsPopup");
        nsPopup.object.onchange = changeHandler;

        loadNetworkServices(widget.preferenceForKey(dashcode.createInstancePreferenceKey("network-service")), updateAllStates);

        for (i = 0; i < buttons.length; i += 1) {
            document.getElementById(buttons[i]).onclick = clickHandler;
        }
    }

    window.loadCompleted = loadCompleted;
    window.loadNetworkServices = loadNetworkServices;
    window.updateAllStates = updateAllStates;
    window.getSelectedNetworkService = getSelectedNetworkService;
}());
