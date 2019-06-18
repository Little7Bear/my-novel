function limitSort(sort, minSort, maxSort) {
    sort = sort < minSort ? minSort : sort
    sort = sort > maxSort ? maxSort : sort
    return sort
}

function getChapterBySort(sort, bookId) {
    $.ajax({
        type: "post",
        url: "/chapter/" + bookId,
        data: {
            sort: sort
        },
        success: function (res) {
            let book = res.book;
            $('#title').text(book.title)
            $('input[name=sort]').val(book.sort)
            $('#content').html(book.content)
        }
    });
}

function setCurrentChapterBySort(sort) {
    let aTagArr = [...$('#tbody a')]
    let aSort = null
    for (const i of aTagArr.keys()) {
        aClass = $(aTagArr[i]).attr('class')
        if (aClass === 'n-active') {
            $(aTagArr[i]).removeClass('n-active')
        }

        aSort = $(aTagArr[i]).attr('data-sort')
        if (aSort == sort) {
            $(aTagArr[i]).addClass('n-active')
        }
    }
}