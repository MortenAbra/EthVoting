App =
    {
        contracts: {},

        init: function () {
            console.log("Initializing web3 provider");
            return App.loadWeb3Provider();
        },
        //Loading web3 provider
        loadWeb3Provider: function () {
            if (typeof web3 !== 'undefined') {
                // If a web3 instance is already provided by Meta Mask.
                App.web3Provider = web3.currentProvider;
                web3 = new Web3(web3.currentProvider);
                console.log("web3 instance already provided");
                ethereum.enable();
            } else {
                // Specify default instance if no web3 instance provided
                App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
                web3 = new Web3(App.web3Provider);
                console.log("No web3 instance provided - Starting instance now...");
                ethereum.enable();
            }
            console.log("Loading contract..");
            return App.loadContracts();
        },

        //Getting the ABI to connect the smart contract to the website
        loadContracts: function () {
            $.getJSON("Ballot.json", function (ballot) {
                /*
                Instantiate truffle contract
                Hereafter setting the provider to interact with the contract
                Then checking for events happening - Like VotedEvent
                Lastly loading the contract data into the website
                 */
                App.contracts.Ballot = TruffleContract(ballot);
                App.contracts.Ballot.setProvider(App.web3Provider);
                App.EventListener();
                console.log("Contract loaded!");
                return App.loadData();
            });
        },

        /*
        Listen for events emitted from the contract
        Reloads after event
         */
        EventListener: function () {
            App.contracts.Ballot.deployed().then(function (app) {
                app.VotedEvent({}, {
                    fromBlock: 'latest',
                    toBlock: 'latest'
                }).watch(function (error, event) {
                    console.log("triggered an event", event);
                    // Reload when a new vote is recorded
                    App.loadData();
                    console.log("Reloading after new vote");
                });
            });
        },


        loadData: function () {
            var ballot;
            var animatedLoader = $('#loader');
            var renderContent = $('#content');
            var alertbox = $('#alert');

            alertbox.hide();


            // Loading the account data
            web3.eth.getCoinbase(function (err, account) {
                if (err === null) {
                    App.account = account;
                    $('#address').html("Account id: " + account);
                    web3.eth.getBalance(account, function (err, balance) {
                        if(err === null) {
                            $("#balance").text("Account Balance: " + web3.fromWei(balance, "ether") + " ETH");
                        }
                    });
                }
            });



            // Load contract data
            App.contracts.Ballot.deployed().then(function (app) {
                ballot = app;
                return ballot.totalCandidates();
            }).then(function (totalCandidates) {
                // Store all promises to get candidate info
                const promises = [];
                for (var i = 1; i <= totalCandidates; i++) {
                    promises.push(ballot.candidates(i));
                }

                // Once all candidates are received, add to dom
                Promise.all(promises).then((candidates) => {
                    var results = $("#results");
                    results.empty();

                    var pickCandidate = $('#pickCandidate');
                    pickCandidate.empty();

                    candidates.forEach(candidate => {
                        var candidateID = candidate[0];
                        var candidateName = candidate[1];
                        var candidateVotes = candidate[2];


                        // Render candidate Result
                        var resultsRenderTemplate = "<tr><th>" + candidateID + "</th><td>" + candidateName + "</td><td>" + candidateVotes + "</td></tr>"
                        results.append(resultsRenderTemplate);

                        // Render candidate ballot option
                        var ballotOptionRender = "<option value='" + candidateID + "' >" + candidateName + "</option>"
                        pickCandidate.append(ballotOptionRender);
                    })
                });

                return ballot.voters(App.account);
            }).then(function (voted) {
                // Do not allow a user to vote
                if (voted) {
                    $('form').hide();
                }
                animatedLoader.hide();
                renderContent.show();
            }).catch(function (error) {
                console.warn(error);
            });
        },

        candidateVote: function () {
            var alertbox = $('#alert');

            alertbox.hide();
            var id = $('#pickCandidate').val();
            App.contracts.Ballot.deployed().then(function (app) {
                return app.candidateVote(id, {from: App.account});
            }).then(function (result) {
                // Wait for votes to update
                $("#content").hide();
                $("#loader").show();
            }).catch(function (err) {
                alertbox.show();
                console.error(err);
            })
        }
    }

$(function () {
    $(window).load(function () {
        App.init();
    });
});
