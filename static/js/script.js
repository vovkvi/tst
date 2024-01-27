$('.author').html('&copy; Vitalii Vovk, ' + new Date().getFullYear());

const pageParams = {
    'data' : getUrlParam('data', undefined)
};

let staticPath;
let yamlPath;
let pagesConfig;

async function fetchConfig() {
    try {
        const response = await fetch('./config.json');
        let data = await response.json();
        staticPath = data.static_path;
        yamlPath = data.yaml_path;
        pagesConfig = data.pages;
    } catch(e) {
        console.error(`[fetchConfig] code: ${e.status}; message: ${e}`);
    }
}

let yamlData;
async function fetchData(yamlName) {
    try {
        const response = await $.get(yamlName);
        yamlData = await jsyaml.load(response);
    } catch(e) {
        console.error(`[fetchData] code: ${e.status}; message: ${e}`);
    }
}

$(document).ready(() => {
    fetchConfig().then(() => {
        let pageCfg = pagesConfig[pageParams['data']];
        if (pageCfg == undefined) {
            renderPage(pagesConfig.default);
            return
        }
        let yamlFile = pageCfg.filename;
        fetchData(`${yamlPath}/${yamlFile}`).then(() => {
            renderPage(pageCfg);
        });
    }); 
});

function getUrlParam(parameter, defaultvalue){
    var urlparam = (window.location.href.indexOf(parameter) >- 1) ? getUrlVars()[parameter] : defaultvalue;
    return (urlparam !== undefined) ? urlparam : defaultvalue;
}

function getUrlVars() {
    var vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function changeTheme() {
    let dark = !parseInt($('body').attr('dark'));
    $('#theme>svg>use').attr('xlink:href', dark ? `${staticPath}/svg/icons.svg#light_mode` : `${staticPath}/svg/icons.svg#dark_mode`);
    $('body').attr('dark', dark ? 1 : 0);
}

function showAnswers() {
    let show_answ = !parseInt($('body').attr('answers'));
    $('#answer>svg>use').attr('xlink:href', show_answ ? `${staticPath}/svg/icons.svg#ri-eye-off-fill` : `${staticPath}/svg/icons.svg#ri-eye-fill`);
    $('body').attr('answers', show_answ ? 1 : 0);
    $('details').attr('open', show_answ);
}

function fullScreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
        $('#screen>svg>use').attr('xlink:href',`${staticPath}/svg/icons.svg#ri-fullscreen-fill`);
    }
    else {
        document.documentElement.requestFullscreen();
        $('#screen>svg>use').attr('xlink:href',`${staticPath}/svg/icons.svg#ri-fullscreen-exit-fill`);
    }
}

function showCardSwithces() {
    let cur = parseInt($('body').attr('card'));
    let cnt = parseInt($('body').attr('count'));
    if (cnt < 1) {
        $('.current-card-number').css('display', 'none');
        $('#btn-next').css('display', 'none');
        $('#btn-prev').css('display', 'none');
    }
    $('#btn-next').css('display', cur == cnt ? 'none' : 'inline-flex');
    $('#btn-prev').css('display', cur < 1 ? 'none' : 'inline-flex');
}

function nextCard() {
    let cur = parseInt($('body').attr('card'));
    let cnt = parseInt($('body').attr('count'));
    if (cur == cnt) {
        return;
    }
    let prevCard = cur;
    let activeCard = cur + 1;
    $('body').attr('card', activeCard);
    $('.current-card-number').html((activeCard + 1) + '&nbsp;/&nbsp;' + (cnt + 1));
    showActiveCard(prevCard, activeCard);
}

function prevCard() {
    let cur = parseInt($('body').attr('card'));
    let cnt = parseInt($('body').attr('count'));
    if (cur < 1) {
        return;
    }
    let prevCard = cur;
    let activeCard = cur - 1;
    $('body').attr('card', activeCard);
    $('.current-card-number').html((activeCard+1) + '&nbsp;/&nbsp;' + (cnt+1));
    showActiveCard(prevCard, activeCard);
}

function showActiveCard(prevCard, activeCard) {
    $(`.center-${prevCard}`).attr('active', '0');
    $(`.center-${activeCard}`).attr('active', '1');
    window.scrollTo(0,0);
    showCardSwithces();
}

function showImg(src) {
    $('.fullscreen-img').attr('src', src);
    $('.fullscreen-container').css('display', 'flex');
}

function closeImg() {
    $('.fullscreen-container').css('display', 'none');
}

function formatAnswerForHtml(answer) {
    var result = [];

    let img_divs = [];
    const match = answer.matchAll(/#\?img([\s\S]*?)\?#/g);
    for (const m of match) {
        const [imgSrc = null, imgAlt = null] = m[1].trim().split('\n');

        let answer_media = Object.assign(document.createElement("div"),{
            className: "answer-media",
            innerHTML: `<img src="./img/${imgSrc}" alt="${imgAlt}" onclick="showImg(this.src);"></img>`
        });
        if (imgAlt != null) {
            answer_media.append(
                Object.assign(document.createElement("h2"),{
                    innerText: imgAlt
                })
            );
        }
        answer = answer.replace(m[0], answer_media.outerHTML);
    }
    answer.split('\n').forEach(e => {
        if (e.startsWith('<div'))
            result.push(e);
        else
            e != '' ? result.push('<p>' + e + '</p>') : null;
    });
    return result.join('');
}

function getDocs(data) {
    let section = pageParams['data'];
    let center = Object.assign(document.createElement("div"),{
        className: `center card-item`
    });
    center.setAttribute('active', '1');
    data[section].forEach(cat => {
        let summary = Object.assign(document.createElement("summary"),{
            innerHTML: cat.hdr
        });
        let details = document.createElement("details");
        details.append(summary);

        cat.subcats.forEach(subcat => {
            if (subcat.hdr == null) {
                let div = Object.assign(document.createElement('div'),{
                    className: 'answer',
                    innerHTML: formatAnswerForHtml(subcat.content)
                });
                details.append(div); 
            }
            else {
                let subdetails = document.createElement("details");
                subdetails.append(
                    Object.assign(document.createElement("summary"),{
                        className: 'summary-subdetails',
                        innerHTML: subcat.hdr
                    }),
                    Object.assign(document.createElement('div'),{
                        className: 'answer-subdetails',
                        innerHTML: formatAnswerForHtml(subcat.content)
                    })
                );
                details.append(subdetails);
            }
        });
        center.append(details);
    });
    $('div.content-loader').before(center);
    window.scrollTo(0,0);
    showCardSwithces();
}

function getCardCenterItem(cardObject, cardIndex = 0) {
    /*
     *   part of html:
     *
     *   <div class="center card-item">
     *       <details>
     *           <summary lang="ru">
     *               ВОПРОС
     *               <span class="ntd" lang="ru"><br>НТД</span>
     *           </summary>
     *           <div class="answer" lang="ru">
     *               <p>ОТВЕТ</p>
     *               ...
     *           </div>
     *       </details>
     *       ...
     *   </div>
     */
    let center = Object.assign(document.createElement("div"),{
        className: `center card-item center-${cardIndex}`
    });
    center.setAttribute('active', '0');
    cardObject.forEach(question => {
        let summary = Object.assign(document.createElement("summary"),{
            innerHTML: question.q
        });
        if (question.n != null) {
            summary.append(Object.assign(document.createElement("span"),{
                className: 'ntd',
                innerHTML: `<br>${question.n}`
            }));
        }
        let div = Object.assign(document.createElement('div'),{
            className: 'answer',
            innerHTML: formatAnswerForHtml(question.a)
        });
        let details = document.createElement("details");
        details.append(summary, div);
        center.append(details);
    });
    return center;
}

function getCards(data) {
    let section = pageParams['data'];
    let cards = [];
    data[section].forEach((card, idx) => {
        cards.push(getCardCenterItem(card, idx));
    });
    cards[0].setAttribute('active', '1');
    let currentCard = 0;
    $('body').attr('card', currentCard);
    let countCard = cards.length -1;
    if (parseInt($('body').attr('count')) === 0) {
        $('body').attr('count', countCard);
    }
    $('.current-card-number').html((currentCard+1) + '&nbsp;/&nbsp;' + (countCard+1));
    cards.forEach(card => {
        $('div.content-loader').before(card);
    });
    window.scrollTo(0,0);
    showCardSwithces();
}

function getTopNavBar(pageCfg, href = '..') {
    /*
    *   part of html:
    *
    *   <div class="top-navigation-bar">
    *       <svg class="ri-icn btn-back" onclick="location.href='..';"><use xlink:href="..."></use></svg>
    *       <div>
    *           <h2 class="top-bar-title" onclick="location.href='..';">...</h2>
    *       </div>
    *   </div>
    */
    let top_navigation_bar = Object.assign(document.createElement("div"),{
         className: 'top-navigation-bar',
         innerHTML: `<svg class="ri-icn btn-back" onclick="location.href='${href}';"><use xlink:href="${staticPath}/svg/icons.svg#arrow_back"></use></svg>`
    });
    let top_bar_title = Object.assign(document.createElement("h2"), {
        className: "top-bar-title",
        innerHTML: pageCfg.description
    });
    top_bar_title.setAttribute('onclick', `location.href='${href}';`);
    let title_div = document.createElement("div");
    title_div.append(top_bar_title);
    top_navigation_bar.append(title_div);
    $('div.content').before(top_navigation_bar);
}

function getMenuCenterDataBlockItem(object) {
    /*
    *   part of html:
    *
    *   <div class="data-block-item box">
    *       <div class="box-image" style="background-image: url(&quot;./static/img/tec14.jpg&quot;);">
    *           <div class="box-image-blur"></div>
    *       </div>
    *       <div class="box-icon">
    *           <svg><use xlink:href="./static/svg/icons.svg#factory"></use></svg>
    *           <div class="box-title">ТЭЦ-14</div>
    *       </div>
    *       <div class="box-bottom">
    *           <div class="box-description">
    *               <h3>Первомайская ТЭЦ</h3>
    *               <div class="box-update">данные обновлены:<br>...</div>
    *               <div class="box-comment">коментарий:<br>...</div>
    *           </div>
    *           <div class="box-btn-read">
    *               <div class="box-btn-read-icon"><svg><use xlink:href="./static/svg/icons.svg#circle"></use></svg></div>
    *               <div class="box-btn-read-label">Читать</div>
    *           </div>
    *       </div>
    *   </div>
    */
    let data_block_item = Object.assign(document.createElement("div"),{
        className: 'data-block-item box'
    });
    data_block_item.onclick = function() {
        window.location = object.href; 
    }
    let box_image = Object.assign(document.createElement("div"),{
        className: 'box-image',
        innerHTML: '<div class="box-image-blur"></div>'
    });
    box_image.style.backgroundImage = `url('${staticPath}/${object.background}')`;
    let box_btn_read = Object.assign(document.createElement("div"),{
        className: 'box-btn-read'
    });
    box_btn_read.append(
        Object.assign(document.createElement("div"),{
            className: 'box-btn-read-icon',
            innerHTML: `<svg><use xlink:href="${staticPath}/svg/icons.svg#circle"></use></svg>`
        }),
        Object.assign(document.createElement("div"),{
            className: 'box-btn-read-label',
            innerHTML: 'Читать'
        })
    );
    let box_icon = Object.assign(document.createElement("div"),{
        className: 'box-icon',
        innerHTML: `<svg><use xlink:href="${staticPath}/${object.icon}"></use></svg>`
    });
    box_icon.append(
        Object.assign(document.createElement("div"),{
            className: 'box-title',
            innerHTML: object.title
        }),
    );
    
    let box_description = Object.assign(document.createElement("div"),{
        className: 'box-description',
        innerHTML: `<h3>${object.description}</h3>`
    });
    box_description.append(
        Object.assign(document.createElement("div"),{
            className: 'box-update',
            innerHTML: `данные обновлены:<br>${object.last_update}`
        })
    );
    if (object.comment != null) {
        box_description.append(
            Object.assign(document.createElement("div"),{
                className: 'box-comment',
                innerHTML: `коментарий:<br>${object.comment}`
            })
        );
    }

    let box_bottom = Object.assign(document.createElement("div"),{
        className: 'box-bottom'
    });
    box_bottom.append(
        box_description,
        box_btn_read
    );
    data_block_item.append(
        box_image,
        box_icon,
        box_bottom
    );
    return data_block_item;
}

function getMenuCenterDataBlock(objects) {
    /*
    *   part of html:
    *
    *   <div class="center-data-block">
    *       <div class="data-block-row">
    *           getDataBlockItem()
    *           ...
    *       </div>
    *       ...
    *   </div>
    */
    let center_data_block = Object.assign(document.createElement("div"),{
        className: 'center-data-block'
    });
    let rows = [];
    objects.forEach((obj,idx) => {
        if (idx % 3 == 0) {
            rows.push([]);
        };
        rows[rows.length - 1].push(getMenuCenterDataBlockItem(obj));
    });
    let result = [];
    rows.forEach(row => {
        let data_block_row = Object.assign(document.createElement("div"),{
            className: 'data-block-row'
        });
        row.forEach(cell => {
            data_block_row.append(cell);
        });
        center_data_block.append(data_block_row);
    });
    return center_data_block;
}

function getMenuPage(data) {
    /*
    *   part of html:
    *
    *   <div class="center">
    *       <h2 class="center-title">...</h2>
    *       getMenuCenterDataBlock()
    *       ...
    *   </div>
    */
    let page_items = [];
    data.forEach((itm, idx) => {
        let center = Object.assign(document.createElement("div"),{
            className: 'center'
        });
        center.setAttribute('active', '1');
        center.append(
            Object.assign(document.createElement("h2"),{
                className: 'center-title',
                innerHTML: itm.title
            }),
            getMenuCenterDataBlock(itm.items)
        );
        page_items.push(center);
    });
    page_items.forEach(itm => {
        $('div.content-loader').before(itm);
    });
}

function renderPage(pageCfg) {
    let doctype = pageCfg.doctype;
    $('title').text(pageCfg.title);
    if (doctype == 'index') {
        getMenuPage(pageCfg.sections);
    }
    else if (doctype == 'menu') {
        getTopNavBar(pageCfg);
        getMenuPage(pageCfg.sections);
    }
    else if (doctype == 'card') {
        getTopNavBar(pageCfg, '.');
        getCards(yamlData);
        $('.navigator-container').css('display', 'block');
    }
    else if (doctype == 'doc') {
        getTopNavBar(pageCfg, '.');
        getDocs(yamlData);
        $('.navigator-container').css('display', 'block');
    }
    else {
       console.log(`Invalid parameter 'doctype' in config file : ${doctype}`); 
    }
    $('.content-loader').css('display','none');
}
