/**
 * @description: 判断滚动条位置是否到最后一个盒子7成高
 * @param {$(selector)} 
 * @return: boolean
 */
function isLoadBook(boxClassList) {
    let lastBox = boxClassList.last()
    let lastBoxDis = lastBox.outerHeight() * 0.7 + lastBox.offset().top
    let scrollTop = $('body').scrollTop() + $('html').scrollTop()
    return lastBoxDis <= $(window).height() + scrollTop
}

function loadBook(docs) {
    for (let i = 0; i < docs.length; i++) {
        let time = moment(docs[i].lastUpdateTime).format(
            'YYYY-MM-DD HH:mm');

        let card = `<div class="card-container">
        <div class="card mb-4 shadow-sm">
            <a href="javascript:;"><img src="${docs[i].cover}" alt="暂无图片" class="card-img-top nimg-cover"></a>

            <div class="card-body">
                <h5 class="card-title nnowrap">${docs[i].bookName}</h5>
                <h6 class="card-subtitle mb-2 text-muted">${docs[i].author}</h6>

                <div class="ncart-content">
                    <p>状态：<span class="status">${docs[i].status}</span></p>
                    <p class="nnowrap" title="${docs[i].latestChapter}">
                        最新章节：<span class="latest-chapter">${docs[i].latestChapter}</span>
                    </p>
                    <p>更新时间：<span class="update-time">${time}</span></p>
                </div>

                <div class="d-flex justify-content-between align-items-center n-button-container">
                    <div class="btn-group" data-id="${docs[i]._id}">
                        <button type="button" class="btn btn-sm btn-outline-secondary n-update">更新</button>
                        <button type="button" class="btn btn-sm btn-outline-secondary n-del">删除</button>
                    </div>

                    <small class="text-success n-card-number"></small>
                </div>

            </div>

            <div class="n-card-model">
                <div class="spinner-border text-primary n-card-spinner" role="status"></div>
            </div>
        </div>
    </div>`
        $('.row').append($(card))
    }
}

