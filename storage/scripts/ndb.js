var jsonData;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function loadNativeInfo() {
    if (jsonData !== undefined) return;

    const file = new XMLHttpRequest();

    file.overrideMimeType("application/json");
    file.open("GET", "storage/NativeInfo.json", true);
    file.onreadystatechange = function () {
        if (file.readyState === 4 && file.status === 200) {
            jsonData = JSON.parse(file.responseText);
        }
    };

    file.send(null);
}


// [============= Namespace Functions =============]
function getNamespaces() {
    let i = 0, v = [];

    for (let ns in jsonData) {
        v[i++] = ns;
    }

    return v;
}

function getNamespaceObjectFromName(namespace) {
    return jsonData[namespace.toUpperCase()];
}

function getNamespaceObjects() {
    let i = 0, v = [];

    for (let ns in jsonData) {
        v[i++] = getNamespaceObjectFromName(ns);
    }

    return v;
}

function getNativeCount(namespace) {
    let i = 0;

    for (let n in getNativeObjects(namespace)) {
        i++;
    }

    return i;
}

function getNativeObjects(namespace) {
    const nsObj = getNamespaceObjectFromName(namespace);
    let i = 0, v = [];

    for (let n in nsObj) {
        v[i++] = nsObj[n];
    }

    return v;
}

// [============= Native Functions =============]

function hasComment(native) {
    return native["comment"] !== "";
}

function isNameKnown(native) {
    return !native["name"].startsWith("_0x");
}

function getNameFromHash(hash) {
    const nsObjs = getNamespaceObjects();
    let i = 0;

    for (let ns in jsonData) {
        for (let native in jsonData[ns]) {
            if (native === hash) {
                return jsonData[ns][native].name;
            }
        }
    }
}

function closeNamespaceTab(namespace) {
    const ele = document.getElementById("ns-" + namespace).parentElement;
    const c = ele.innerHTML.split("<ul")[0];
    ele.innerHTML = c;
    document.getElementById("ns-" + namespace).addEventListener("click", function () {
        console.log("sup");
        openNamespaceTab(namespace);
    })
}

function openNamespaceTab(namespace) {
    const ele = document.getElementById("ns-" + namespace);
    const natives = getNativeObjects(namespace);

    let htmlCode = ele.parentElement.innerHTML + "<ul id='na-" + namespace + "'>";

    let i = 0;

    for (let n in jsonData[namespace]) {
        const native = natives[i++];

        const name = native.name;
        const comment = native.comment;
        const jHash = native.jhash;
        const params = native.params;
        const returnType = native.return_type;
        const paramCount = native.param_count;
        const returnSize = native.return_size;

        htmlCode += "<li><a class='nativeName' id='func-" + n + "'>" + " 	•  " +
            "<span class='datatype'>" + returnType + " </span>" +
            name + "(";

        for (let para = 0; para < paramCount; para++) {
            const parameter = params[para];

            const type = parameter.type;
            const name = parameter.name;

            htmlCode += "<span class='datatype'>" + type + "  </span>" +
                "<span class='parameterName'>" + name + (para !== paramCount - 1 ? ", " : "") + "</span>";
        }

        htmlCode += ")  ";
        htmlCode += "<span class='hash'>//  " + n + "  " + jHash + "</span>";
    }

    htmlCode += "</ul>";

    ele.parentElement.innerHTML = htmlCode;

    i = 0;
    for (let n in jsonData[namespace]) {
        document.getElementById("func-" + n).addEventListener("click", function () {
            openFunctionInformation(namespace, n, document.getElementById("func-" + n).innerHTML.substring(3));
        });
    }

    document.getElementById("ns-" + namespace).addEventListener("click", function () {
        closeNamespaceTab(namespace);
    });
}

function openFunctionInformation(namespace, functionHash, functionDeclHTML) {
    const name = getNameFromHash(functionHash);
    const ele = document.getElementById("func-" + functionHash).parentElement;
    const nativeObj = jsonData[namespace][functionHash];

    ele.innerHTML += "<div class='funcbox'>" +
        "<h2>" + namespace + "::" + name + "</h2><hr>" +
            functionDeclHTML + "<hr>" +
        (hasComment(nativeObj) ? nativeObj.comment : "No comment available!") + "<br>";
    "</div>";

    document.getElementById("func-" + functionHash).addEventListener("click", function() {
        closeFunctionInformation(ele, namespace, functionHash, functionDeclHTML);
    });
}

function closeFunctionInformation(funcElement, namespace, funcHash, funcDeclHTML) {
    console.log(funcElement.innerHTML);
    funcElement.innerHTML = funcElement.innerHTML.split("<div")[0];

    document.getElementById("func-" + funcHash).addEventListener("click", function () {
        openFunctionInformation(namespace, funcHash, funcDeclHTML);
    })
}

async function init() {
    loadNativeInfo();

    while (jsonData === undefined) {
        await sleep(1);
    }

    let namespaces = "";
    let nsCount = 0, nCount = 0, cCount = 0, kCount = 0;
    const v = getNamespaces();

    for (let i = 0; i < v.length; i++) {
        const nC = getNativeCount(v[i]);
        const nObjs = getNativeObjects(v[i]);

        for (let j = 0; j < nObjs.length; j++) {
            if (hasComment(nObjs[j])) {
                cCount++;
            }
            if (isNameKnown(nObjs[j])) {
                kCount++;
            }
        }

        nCount += nC;
        nsCount++;
        namespaces += "<li><a id='ns-" + v[i] + "' title='" + v[i] + "'>" + v[i] + " [" + nC + "]</a></li>\n";
    }

    document.getElementById("nname").innerHTML = namespaces;

    for (let i = 0; i < v.length; i++) {
        document.getElementById("ns-" + v[i]).addEventListener("click", function () {
            openNamespaceTab(v[i]);
        })
    }

    document.getElementById("infobox").innerHTML = "Namespaces: " + nsCount + " | " + "Natives: " + nCount + " | " + "Comments: " + cCount + " | " + "Known names: " + kCount;

    getNativeCount("APP");
}