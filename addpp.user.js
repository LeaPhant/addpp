// ==UserScript==
// @name         addpp
// @version      0.7.1
// @description  look up how much pp someone would have if they made a new score with x pp.
// @author       Nodebuck
// @match        *://osu.ppy.sh/u/*
// @updateURL    https://github.com/Nodebuck/addpp/raw/master/addpp.user.js
// @grant GM_setValue
// @grant GM_getValue
// ==/UserScript==

function compare(a,b){
    if(parseFloat(a.pp) > parseFloat(b.pp)) return -1;
    if(parseFloat(a.pp) < parseFloat(b.pp)) return 1;
    return 0;
}

function numberWithCommas(x){
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var api_key = GM_getValue("api_key");

$(function(){
    'use strict';
    $('html').on("click", "#general .profileStatLine b:first-child", (function(){
        if(!api_key){
          api_key = prompt("Enter your API key");
          if(api_key === null) return;
          else GM_setValue("api_key", api_key.toString());
        }
        var pp = 0, pp_full = 0, pp_no_bonus = 0, max = 0, pp_to_add = 0;
        var pp_array, pp_array_new = [];
        var no_bonus_pp = false;
        pp_to_add = prompt("Enter pp to add");
        
        if(pp_to_add === null) return;

        $("<div id=\"add_pp_container\" class=\"profileStatLine\"><b>Working...</b></div>").insertAfter($(".profileStatLine").first());
        
        var user = userId;

        var start = Date.now();
        $.ajax("https://osu.ppy.sh/api/get_user?k=" + api_key + "&u=" + user, {type: "get", error: function(jqXHR, exception){
                GM_setValue("api_key", "");
                $("#add_pp_container").html("<b>Error: " + JSON.parse(jqXHR.responseText)["error"] + "</b>");
                return;
            }, success: function(body){
            start = Date.now();
            var json = body;
            pp_full = parseFloat(json[0].pp_raw);
            $.get("https://osu.ppy.sh/api/get_user_best?k=" + api_key + "&limit=100&u=" + user, function(body){
 
                start = Date.now();
                var json = body;
                pp_array = json;
                max = json.length;
                json.forEach(function(value, index){
                    var current_pp = parseFloat(value.pp);
                    var current_factor = Math.pow(0.95, index);
                    var current_pp_weighted = current_pp * current_factor;

                    pp += current_pp_weighted;

                    //console.log(current_pp + " - " + current_pp_weighted + " - " + current_factor);
                });
                
                if(pp_full < 0){ pp_full = 0; no_bonus_pp = true; }

                pp_no_bonus = pp_full - pp;

                pp_array.push({pp: pp_to_add});
                pp_array.sort(compare);
                pp_array.splice(max, 1);

                pp_array.forEach(function(value, index){
                    var current_pp = parseFloat(value.pp);
                    var current_factor = Math.pow(0.95, index);
                    var current_pp_weighted = current_pp * current_factor;
                    
                    pp_no_bonus += current_pp_weighted;

                    //console.log(current_pp + " - " + current_pp_weighted + " - " + current_factor);
                });
                
                if(pp_no_bonus){
                    $("#add_pp_container").html("<b>New Performance: " + numberWithCommas(pp_no_bonus.toFixed(0)) + "pp (when a " + numberWithCommas(pp_to_add) + "pp score is achieved - no bonus pp included, user not active)</b>").attr("id", "");
                }else{
                    $("#add_pp_container").html("<b>New Performance: " + numberWithCommas(pp_no_bonus.toFixed(0)) + "pp (when a " + numberWithCommas(pp_to_add) + "pp score is achieved)</b>").attr("id", "");
                }

                console.log("Current pp: " + pp_full);
                console.log("Added pp: " + pp_to_add + " -> " + (pp_no_bonus - pp_full).toFixed(1));
                console.log("Result: " + pp_no_bonus.toFixed(1));
            });
        }});
    }));
});
