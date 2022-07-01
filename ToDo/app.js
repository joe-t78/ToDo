const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");

const app=express();

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-joe:admin123@db1.kibsb.mongodb.net/todolistDB");

const itemsSchema={
  name: String
};

const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
  name: "Welcome to your friendly task logger!"
});

const item2=new Item({
  name: "Press the + button to add a new task"
});

const item3=new Item({
  name: "<-- hit this to mark the task as finished"
});

defaultItems=[item1,item2,item3];

const listSchema={
  name: String,
  items:[itemsSchema]
}

const List=mongoose.model("List",listSchema);

app.listen(process.env.PORT,function(){
  console.log("Server is running.");
})

app.get("/",function(req,res){

  let today=new Date();

  let options={
    weekday: "long",
    day: "numeric",
    month: "long"
  }

  let day=today.toLocaleDateString("en-IN",options);

  Item.find({},function(err,foundItems){

    if(foundItems.length===0)
    {
      Item.insertMany(defaultItems,function(err){
        if(err)
        {
          console.log(err);
        }
        else
        {
          console.log("success");
        }
      })

      res.redirect("/");
    }

    res.render("list",{
      kindOfDay: day,
      title: "General",
      newListItem: foundItems
    });

  });

})

app.get("/:parameter",function(req,res){

  let today=new Date();

  let options={
    weekday: "long",
    day: "numeric",
    month: "long"
  }

  let day=today.toLocaleDateString("en-IN",options);

  const listName=_.capitalize(req.params.parameter);

  List.findOne({name: listName},function(err,foundList){
    if(!err)
    {
      if(!foundList)
      {
        const list=new List({
          name: listName,
          items: defaultItems
        })

        list.save();

        res.redirect("/"+listName);
      }
      else
      {
        res.render("list",{
          kindOfDay: day,
          title: foundList.name,
          newListItem: foundList.items
        });
      }
    }
  })

})

app.post("/",function(req,res){

  const listName=_.capitalize(req.body.button);

  const task=new Item({
    name: req.body.newItem
  });

  if(listName==="General")
  {
    task.save();
    res.redirect("/");
  }
  else
  {
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(task);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
})

app.post("/delete",function(req,res){

  const del_item_id=req.body.checkbox;
  const listName=_.capitalize(req.body.listName);

  if(listName==="General")
  {
    Item.findByIdAndRemove(del_item_id,function(err){
      if(!err)
      {
        console.log("successful deletion");
        res.redirect("/");
      }
    });
  }
  else
  {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: del_item_id}}},
      function(err, foundList)
      {
        if(!err)
        {
          res.redirect("/"+listName);
        }
      }
    )
  }
})
