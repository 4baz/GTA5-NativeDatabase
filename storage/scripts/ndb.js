var jsonData;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function loadNativeInfo() {
    if (jsonData !== undefined) return;

    const file = new XMLHttpRequest();

    file.overrideMimeType("application/json");
    file.open("GET", "https://raw.githubusercontent.com/DatBrick/NativeDatabase/master/Natives.json", true);
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

function isNamespaceTabOpened(namespace) {
    return document.getElementById("na-" + namespace.toUpperCase()) !== null;
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
        const returnSize = native.return_size;

        htmlCode += "<li><a class='nativeName' id='func-" + n + "'>" + " 	•  " +
            "<span class='datatype'>" + returnType + " </span>" +
            name + "(";

        for (let para = 0; para < params.length; para++) {
            const parameter = params[para];

            const type = parameter.type;
            const name = parameter.name;

            htmlCode += "<span class='datatype'>" + type + "  </span>" +
                "<span class='parameterName'>" + name + (para !== params.length - 1 ? ", " : "") + "</span>";
        }

        htmlCode += ")  ";
        htmlCode += "<span class='hash'>//  " + n + (jHash !== undefined ? "  " + jHash : "") + "</span>";
    }

    htmlCode += "</ul>";

    ele.parentElement.innerHTML = htmlCode;

    for (let n in jsonData[namespace]) {
        const funcElement = document.getElementById("func-" + n);

        funcElement.addEventListener("click", function () {
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

    let newHTML = "<div style='padding-left: 1%;'><div class='funcbox'>" +
        "<h2>" + namespace + "::" + name + "</h2><hr>" +
        functionDeclHTML + "<hr>";

    newHTML += "<p style='white-space: pre-wrap;'>";

    if (hasComment(nativeObj)) {
        newHTML += nativeObj.comment;
    } else newHTML += "No comment available";

    newHTML += "</p></div></div>";

    ele.innerHTML += newHTML;

    document.getElementById("func-" + functionHash).addEventListener("click", function() {
        closeFunctionInformation(ele, namespace, functionHash, functionDeclHTML);
    });
}

function closeFunctionInformation(funcElement, namespace, funcHash, funcDeclHTML) {
    funcElement.innerHTML = funcElement.innerHTML.split("<div")[0];

    document.getElementById("func-" + funcHash).addEventListener("click", function () {
        openFunctionInformation(namespace, funcHash, funcDeclHTML);
    })
}

function joaat(key) {
    let hash = 0, i = 0;

    for (i = 0; i < key.length; i++) {
        hash += key.charCodeAt(i);
        hash += (hash << 10);
        hash ^= (hash >> 6);
    }
    hash += (hash << 3);
    hash ^= (hash >> 11);
    hash += (hash << 15);
    return hash >>> 0;
}

async function init() {
    loadNativeInfo();

    while (jsonData === undefined) {
        await sleep(1);
    }

    console.log(joaat("get_player_ped"))
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
        namespaces += "<li><a class='namespace' id='ns-" + v[i] + "'>" + v[i] + " [" + nC + "]</a></li>\n";
    }

    document.getElementById("nname").innerHTML = namespaces;

    for (let i = 0; i < v.length; i++) {
        document.getElementById("ns-" + v[i]).addEventListener("click", function () {
            openNamespaceTab(v[i]);
        })
    }

    const infobox = document.getElementById("infobox");
    infobox.innerHTML = "<a class='nohover' style='float: left'>Namespaces: " + nsCount + " | " + "Natives: " + nCount + " | " + "Comments: " + cCount + " | " + "Known names: " + kCount + "</a>" + infobox.innerHTML;

    document.getElementById("expand").addEventListener("click", function () {
        const c = getNamespaces();

        for (let ns in c) {
            let name = c[ns];

            if (!isNamespaceTabOpened(name)) {
                openNamespaceTab(name);
            }
        }
    });

    document.getElementById("collapse").addEventListener("click", function () {
        const c = getNamespaces();

        for (let ns in c) {
            let name = c[ns];

            if (isNamespaceTabOpened(name)) {
                closeNamespaceTab(name);
            }
        }
    })

}