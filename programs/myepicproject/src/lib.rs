use anchor_lang::prelude::*;

declare_id!("CbFWnzKq7z7Wbe2g8j1VULFLBnNns1f23bANcoupFSXv");

#[program]
pub mod myepicproject {
  use super::*;
  pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> ProgramResult {
    // Get a reference to the account.
    let base_account = &mut ctx.accounts.base_account;
    // Initialize total_gifs.
    base_account.total_gifs = 0;
    Ok(())
  }
  	// Another function woo!
    pub fn add_gif(ctx: Context<AddGif>, gif_link: String, user_address: Pubkey) -> ProgramResult {
        // Get a reference to the account and increment total_gifs.
        let base_account = &mut ctx.accounts.base_account;

        // Build the struct.
        let item = ItemStruct {
            gif_link: gif_link.to_string(),
            user_address: user_address,
            upvotes: 0,
            downvotes: 0,
        };

        // Add it to the gif_list vector.
        base_account.gif_list.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }

    pub fn upvote_item(ctx: Context<UpvoteItem>, gif_link: String) -> ProgramResult {
        // Get a reference to the account and increment total_gifs.
        let base_account = &mut ctx.accounts.base_account;

        let mut index = 0;
        let gif_to_upvote: String = String::from(gif_link);
        for (i, el) in base_account.gif_list.iter().enumerate() {
            
            if gif_to_upvote.eq(&el.gif_link) {
                index = i;
            }
        }

        // Add it to the gif_list vector.
        base_account.gif_list[index].upvotes += 1;
        Ok(())
    }

    pub fn downvote_item(ctx: Context<DownvoteItem>, gif_link: String) -> ProgramResult {
        // Get a reference to the account and increment total_gifs.
        let base_account = &mut ctx.accounts.base_account;

        let mut index = 10;
        let gif_to_upvote: String = String::from(gif_link);
        for (i, el) in base_account.gif_list.iter().enumerate() {
            
            if gif_to_upvote.eq(&el.gif_link) {
                index = i;
            }
        }

        // Add it to the gif_list vector.
        base_account.gif_list[index].downvotes += 1;
        Ok(())
    }
}

// Attach certain variables to the StartStuffOff context.
#[derive(Accounts)]
pub struct StartStuffOff<'info> {
    #[account(init, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program <'info, System>
}

// Specify what data you want in the AddGif Context.
// Getting a handle on the flow of things :)?
#[derive(Accounts)]
pub struct AddGif<'info> {
  #[account(mut)]
  pub base_account: Account<'info, BaseAccount>
}
  
#[derive(Accounts)]
pub struct UpvoteItem<'info> {
  #[account(mut)]
  pub base_account: Account<'info, BaseAccount>
}
  
#[derive(Accounts)]
pub struct DownvoteItem<'info> {
  #[account(mut)]
  pub base_account: Account<'info, BaseAccount>
}

// Create a custom struct for us to work with.
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user_address: Pubkey,
    pub upvotes: u32,
    pub downvotes: u32
}

// Tell Solana what we want to store on this account.
#[account]
pub struct BaseAccount {
    pub total_gifs: u64,
    pub gif_list: Vec<ItemStruct>
}