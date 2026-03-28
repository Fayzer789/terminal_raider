const problemes = [
  {
    nom: "b%oucleiNFLinie.js",
    code: `let i = 0;
            while(i < 5) {
                console.log(i);
            }`,
    indice: ["il manque un i non ?"],
    reponse: ["ton i n'est jamais incrémenté... Il ne dépassera jamais 0..."],
    verifier: (code) => {
      const bloc = code.split("while")[1];
      if (!bloc) return false;
      return bloc.includes("i++") || bloc.includes("i += 1");
    },
    solutionIdeale: ["i++;"],
  },
  
  {
    nom: "scopeVarLet.js",
    code: `if(true) {
            let message = "Salut";
          }
          console.log(message);`,
    indice: ["la variable est-elle accessible ici ?"],
    reponse: ["la variable 'message' est déclarée avec let dans un bloc, elle n'existe pas en dehors..."],
    verifier: (code) => {
      const avantIf = code.split("if")[0];
      return avantIf.includes("let message") || avantIf.includes("var message");
    },
    solutionIdeale: ["let message;", "message = \"Salut\";"],
  }

];
  