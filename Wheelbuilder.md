## Implemented new Javascript
* assests/js/wb.js
    ** initialized in assests/js/theme/product/ProductUtils.js


## Changes in templates
* templates/core/froms/options/set-select.html
    ```
    {{display_name}} -> <span class="wb-option-display-name">{{display_name}}</span>
    
    class=wb-option
    <option value="{{id}}" class="wb-option" {{#if selected}}selected{{/if}} data-product-attribute-value="{{id}}">
    ```
     