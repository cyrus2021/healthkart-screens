/**
 * Created by shani.kumar on 7/3/2017.
 */
var HK=HK || {};
HK.AutoCompleter = function () {
  return {
    autocomplete: function (el, dataUrl, onSuccess, onSelect, minlength, items) {
      var itemsList = new Array();
      var NoResultsLabel = "No Results";
      el.autocomplete({
        source: function (request, response) {
          $.ajax({
            url: dataUrl,
            dataType: "json",
            data: {
              q: request.term,
              noRs: items > 0 ? items : 10
            },
            success: function (responseData) {
              var autoId = el.parent('.autoParent').find('.autoId');
              itemsList = onSuccess.call(this, responseData, autoId);

              if (!itemsList.length) {
                itemsList = [NoResultsLabel];
              }
              response(itemsList);
            }
          });
        },
        minLength: minlength,
        delay: 300,
        select: function (event, ui) {
          if (onSelect != null) {
            onSelect.call(this, ui);
          }
        }
      });
    }
  }
}
HK.AutoCompleter();
HK.mtgt = {
  APPROVED : 'Approved'
};
