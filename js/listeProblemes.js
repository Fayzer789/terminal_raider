const problemes = [
  {
    nom: "b%oucleiNFLinie.js",
    code: `let i = 0;
            while(i < 5) {
                console.log(i);
            }`,
    indice: ["il manque un i non ?"],
    reponse: ["ton i n'est jamais incrémenté... Il ne dépassera jamais 1..."],
    verifier: (code) => {
      const bloc = code.split("while")[1];
      if (!bloc) return false;
      return bloc.includes("i++") || bloc.includes("i += 1");
    },
    solutionIdeale: ["i++;"],
  },
];
