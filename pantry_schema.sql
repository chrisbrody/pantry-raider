CREATE TABLE Pantries (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE PantryUsers (
    pantry_id uuid references Pantries(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    role text not null check (role in ('owner', 'member')),
    can_edit boolean default true,
    added_at timestamp with time zone default timezone('utc'::text, now()),
    primary key (pantry_id, user_id)
);





CREATE TABLE PantryItems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pantryId UUID REFERENCES Pantries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity FLOAT,
    unit TEXT,
    category TEXT,
    avgPrice NUMERIC(10, 2),
    location TEXT,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE Recipes (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    servings INTEGER,
    prepTime INTEGER,
    cookTime INTEGER,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE RecipeIngredients (
    id UUID PRIMARY KEY,
    recipeId UUID REFERENCES Recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity FLOAT,
    unit TEXT
);

CREATE TABLE MealPlans (
    id UUID PRIMARY KEY,
    date DATE NOT NULL,
    mealType TEXT CHECK (mealType IN ('breakfast', 'lunch', 'dinner', 'snack')),
    recipeId UUID REFERENCES Recipes(id) ON DELETE SET NULL,
    servings INTEGER
);

CREATE TABLE ShoppingLists (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ShoppingListItems (
    id UUID PRIMARY KEY,
    shoppingListId UUID REFERENCES ShoppingLists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity FLOAT,
    unit TEXT,
    checked BOOLEAN DEFAULT FALSE
);
