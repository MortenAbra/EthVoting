ElectionApp =
    {
        web3Provider: null,
        contracts: {},

        init: function () {
            console.log("Initializing web3 provider");
            return ElectionApp.loadWeb3Provider();
        },
        //Loading web3 provider
        loadWeb3Provider: function () {
            if (typeof web3 !== 'undefined') {
                // If a web3 instance is already provided by Meta Mask.
                ElectionApp.web3Provider = web3.currentProvider;
                web3 = new Web3(web3.currentProvider);
                console.log("web3 instance already provided");
                ethereum.enable();
            } else {
                // Specify default instance if no web3 instance provided
                ElectionApp.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
                web3 = new Web3(ElectionApp.web3Provider);
                web3.eth.defaultAccount = web3.eth.account[0];
                console.log("No web3 instance provided - Starting instance now...");
                ethereum.enable();
            }
            console.log("Loading contract..");
            return ElectionApp.loadContracts();
        },


        /*
        Instantiate truffle contract
        Getting the ABI to connect the smart contract to the website
        Hereafter setting the provider to interact with the contract
        Then checking for events happening - Like VotedEvent
        Lastly loading the contract data into the website
         */
        loadContracts: function () {
            $.ajax({
                type: "GET",
                url: "Ballot.json",
                success: function (data) {
                    ElectionApp.contracts.Ballot = TruffleContract(data);
                    ElectionApp.contracts.Ballot.setProvider(ElectionApp.web3Provider);
                    ElectionApp.EventListener();
                    console.log("Contract loaded!");
                    return ElectionApp.loadData();
                },
                error: function (jqXHR, textStatus, error) {
                    console.log(error);
                }
            });
        },

        /*
        Listen for events emitted from the contract
        Reloads after event

         */

        EventListener: function () {
            ElectionApp.contracts.Ballot.deployed().then(function (app) {
                app.VotedEvent({}, {
                    fromBlock: 'latest',
                    toBlock: 'latest'
                }).watch(function (error, event) {
                    console.log("triggered an event", event);
                    // Reload when a new vote is recorded
                    ElectionApp.loadData();
                    console.log("Reloading after new vote");
                });
            });
        },

        loadData: function () {
            var ballot;
            var alertbox = $('#alert');

            alertbox.hide();


            // Loading the account data
            web3.eth.getCoinbase(function (error, userAccount) {
                if (error === null) {
                    ElectionApp.account = userAccount;
                    $('#address').html("Account id: " + userAccount);
                    web3.eth.getBalance(userAccount, function (error, balance) {
                        if (error === null) {
                            $("#balance").text("Account Balance: " + web3.fromWei(balance, "ether") + " ETH");
                        }
                    });
                }
            });

            // Load contract data
            ElectionApp.contracts.Ballot.deployed().then(function (app) {
                ballot = app;
                return ballot.totalCandidates();
            }).then(function (totalCandidates) {

                /*
                By storing all promises to get the right candidate info, so whem all candidates have been recieved, they can be added to the front-end
                */
                const groupPromises = [];
                for (var i = 1; i <= totalCandidates; i++) {
                    groupPromises.push(ballot.candidates(i));
                    Promise.all(groupPromises).then((candidates) => {
                        var results = $("#results");
                        var pickCandidate = $('#pickCandidate');


                        results.empty();
                        console.log("Emptying results!");
                        pickCandidate.empty();
                        console.log("Emptying selector!");

                        candidates.forEach(candidate => {
                            var candidateID = candidate[0];
                            var candidateName = candidate[1];
                            var candidateVotes = candidate[2];
                            var resultsRenderTemplate = "<tr><th>" + candidateID + "</th><td>" + candidateName + "</td><td>" + candidateVotes + "</td></tr>"
                            var ballotOptionRender = "<option value='" + candidateID + "' >" + candidateName + "</option>"

                            results.append(resultsRenderTemplate);
                            pickCandidate.append(ballotOptionRender);

                        })
                    });
                }
            });
        },

        candidateVote: function () {
            var alertbox = $('#alert');
            var id = $('#pickCandidate').val();

            alertbox.hide();
            ElectionApp.contracts.Ballot.deployed().then(function (app) {
                return app.candidateVote(id, {from: ElectionApp.account});
            }).then(function (result) {
                // Wait for votes to update
                console.log("Hiding ui");
                $('#form').hide();
            }).catch(function (err) {
                alertbox.show();
                console.error(err);
            })
        },

        voterAuthorized: function () {
            var alertbox = $('#alert');
            var votersAddress = document.getElementById("inputID").value;
            var instance;
            ElectionApp.contracts.Ballot.deployed().then(function (app) {
                instance = app;
                return instance.authorize(votersAddress);
            }).then(function (result) {
                console.log(votersAddress);
            });

        },

        createCandidate: function () {
            var candidateForm = document.getElementById("newCandidateID").value;
            var instance;
            ElectionApp.contracts.Ballot.deployed().then(function (app) {
                instance = app;
                return instance.newCandidate(candidateForm);
            }).then(function (results) {
                console.log(candidateForm);
            });
        }
    }

$(function () {
    $(window).load(function () {
        ElectionApp.init();
    });
});
